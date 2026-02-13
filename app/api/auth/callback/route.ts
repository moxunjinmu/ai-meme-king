import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url))
  }

  try {
    // 交换 code 获取 access_token
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_SECONDME_AUTH_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID,
        client_secret: process.env.SECONDME_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", tokenResponse.status, errorText)
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log("Token data:", tokenData)

    // 获取用户信息 - SecondMe API 端点: /api/secondme/user/info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_SECONDME_API_URL}/api/secondme/user/info`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("User info fetch failed:", userResponse.status, errorText)
      throw new Error(`Failed to fetch user info: ${userResponse.status} ${errorText}`)
    }

    const userData = await userResponse.json()
    console.log("User data:", userData)

    // SecondMe 返回的数据格式: { code: 0, message: 'success', data: { name, bio, avatar } }
    const userInfo = userData.data || userData
    const userId = userInfo.id || userInfo.userId || `user_${Date.now()}`

    console.log("Processing user:", userId, userInfo)

    // 将用户信息保存到数据库
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: userInfo.name || userInfo.username || userInfo.nickname || '用户',
        avatar: userInfo.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
      create: {
        id: userId,
        username: userInfo.name || userInfo.username || userInfo.nickname || '用户',
        avatar: userInfo.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
    })

    // 设置 cookie 并重定向到首页
    const response = NextResponse.redirect(new URL("/", request.url))

    response.cookies.set("access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set("user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url))
  }
}
