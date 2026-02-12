import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取用户投稿记录
 * GET /api/user/memes
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

    const memes = await prisma.meme.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { memes },
    })
  } catch (error) {
    console.error('获取投稿记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取投稿记录失败' },
      { status: 500 }
    )
  }
}
