import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取用户投票历史
 * GET /api/user/votes
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

    const votes = await prisma.vote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        meme: {
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { votes },
    })
  } catch (error) {
    console.error('获取投票历史失败:', error)
    return NextResponse.json(
      { success: false, error: '获取投票历史失败' },
      { status: 500 }
    )
  }
}
