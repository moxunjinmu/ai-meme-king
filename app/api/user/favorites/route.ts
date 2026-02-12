import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取用户收藏的梗
 * GET /api/user/favorites
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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

    const total = await prisma.favorite.count({
      where: { userId },
    })

    // 提取梗数据
    const memes = favorites.map(f => f.meme)

    return NextResponse.json({
      success: true,
      data: {
        memes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取收藏列表失败' },
      { status: 500 }
    )
  }
}
