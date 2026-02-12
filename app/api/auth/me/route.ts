import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 */
export async function GET(request: NextRequest) {
  try {
    // 从 cookie 获取用户ID
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error("获取用户信息失败:", error)
    return NextResponse.json(
      { success: false, error: "获取用户信息失败: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
