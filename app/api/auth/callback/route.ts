import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // 获取存储的 state
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  console.log("OAuth callback received:", { code: code?.substring(0, 10), state, storedState: storedState?.substring(0, 10) })

  // 检查错误
  if (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(new URL("/?error=oauth_denied", request.url))
  }

  // 验证参数
  if (!code) {
    console.error("Missing authorization code")
    return NextResponse.redirect(new URL("/?error=missing_code", request.url))
  }

  // 验证 state 防止 CSRF
  if (!state || state !== storedState) {
    console.error("State mismatch:", { state, storedState })
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url))
  }

  try {
    // 清除已使用的 state
    cookieStore.delete("oauth_state")

    // 构建请求体（x-www-form-urlencoded 格式）
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI!,
      client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!,
    })

    console.log("Token request params:", tokenParams.toString())

    // Token 端点: POST /api/oauth/token/code
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_SECONDME_API_URL}/api/oauth/token/code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", tokenResponse.status, errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log("Token response:", { code: tokenData.code, hasData: !!tokenData.data })

    // 检查响应 code
    if (tokenData.code !== 0) {
      console.error("Token API error:", tokenData.message)
      throw new Error(`Token API error: ${tokenData.message}`)
    }

    // 获取 accessToken（注意字段名是 accessToken 不是 access_token）
    const { accessToken, refreshToken, expiresIn } = tokenData.data

    // 获取用户信息
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_SECONDME_API_URL}/api/secondme/user/info`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("User info fetch failed:", userResponse.status, errorText)
      throw new Error(`User info fetch failed: ${userResponse.status} ${errorText}`)
    }

    const userData = await userResponse.json()
    console.log("User info response:", { code: userData.code, hasData: !!userData.data })

    if (userData.code !== 0) {
      console.error("User API error:", userData.message)
      throw new Error(`User API error: ${userData.message}`)
    }

    // 提取用户信息（字段名可能是 name 或 username）
    const userInfo = userData.data
    const userId = userInfo.id || userInfo.userId || `user_${Date.now()}`
    const username = userInfo.name || userInfo.username || userInfo.nickname || '用户'
    const avatar = userInfo.avatar || null

    console.log("Saving user:", { userId, username })

    // 将用户信息保存到数据库
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: username,
        avatar: avatar,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
      create: {
        id: userId,
        username: username,
        avatar: avatar,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    })

    // 设置 cookie 并重定向到首页
    const response = NextResponse.redirect(new URL("/", request.url))

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn || 60 * 60 * 24 * 7, // 使用 expiresIn 或默认 7 天
    })

    response.cookies.set("user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    console.log("Login successful, redirecting to home")
    return response

  } catch (error) {
    console.error("OAuth callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "unknown_error"
    return NextResponse.redirect(new URL(`/?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
