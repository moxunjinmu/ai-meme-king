import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/**
 * 获取管理员统计数据
 * GET /api/admin/stats
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    // 检查是否为管理员
    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "无权访问" },
        { status: 403 }
      )
    }

    const [
      totalMemes,
      pendingMemes,
      approvedMemes,
      rejectedMemes,
      totalUsers,
      totalVotes,
      totalComments,
    ] = await Promise.all([
      prisma.meme.count(),
      prisma.meme.count({ where: { status: "pending" } }),
      prisma.meme.count({ where: { status: "approved" } }),
      prisma.meme.count({ where: { status: "rejected" } }),
      prisma.user.count(),
      prisma.vote.count(),
      prisma.comment.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalMemes,
        pendingMemes,
        approvedMemes,
        rejectedMemes,
        totalUsers,
        totalVotes,
        totalComments,
      },
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
