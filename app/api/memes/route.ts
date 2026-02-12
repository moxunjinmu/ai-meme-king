import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取梗列表
 * GET /api/memes?sort=hot|new&tag=xxx&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'hot' // hot, new
    const tag = searchParams.get('tag')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      status: 'approved',
    }

    if (tag) {
      where.tags = {
        contains: tag,
      }
    }

    // 构建排序
    let orderBy: any = {}
    if (sort === 'hot') {
      orderBy = { voteCount: 'desc' }
    } else {
      orderBy = { createdAt: 'desc' }
    }

    // 查询数据
    const [memes, total] = await Promise.all([
      prisma.meme.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.meme.count({ where }),
    ])

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
    console.error('获取梗列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取梗列表失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
