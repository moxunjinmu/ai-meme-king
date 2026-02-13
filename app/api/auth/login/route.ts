import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

// 生成随机 state 用于 CSRF 防护
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: NextRequest) {
  // 生成随机 state
  const state = generateState()

  // 存储 state 到 cookie（用于后续验证）
  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 分钟有效期
  })

  // 构建 SecondMe OAuth 授权 URL
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI!,
    response_type: "code",
    state: state,
  })

  // 授权端点: https://go.second.me/oauth/
  const authUrl = `https://go.second.me/oauth/?${params.toString()}`

  return NextResponse.redirect(authUrl)
}
