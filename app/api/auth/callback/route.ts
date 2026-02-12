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
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()

    // 获取用户信息
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_SECONDME_API_URL}/api/v1/user/info`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user info")
    }

    const userData = await userResponse.json()

    // 将用户信息保存到数据库
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        username: userData.username || userData.name || '用户',
        avatar: userData.avatar || userData.picture,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
      create: {
        id: userData.id,
        username: userData.username || userData.name || '用户',
        avatar: userData.avatar || userData.picture,
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

    response.cookies.set("user_id", userData.id, {
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
