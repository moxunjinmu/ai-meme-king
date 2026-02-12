import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * 用户登出
 * POST /api/auth/logout
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "登出成功",
  })

  // 清除 cookie
  response.cookies.delete("access_token")
  response.cookies.delete("user_id")

  return response
}
