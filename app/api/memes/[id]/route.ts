import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取单个梗详情
 * GET /api/memes/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id

    const meme = await prisma.meme.findUnique({
      where: {
        id: memeId,
        status: 'approved'
      },
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

    if (!meme) {
      return NextResponse.json(
        { success: false, error: '梗不存在' },
        { status: 404 }
      )
    }

    // 获取相关推荐（相同标签或相同作者）
    const relatedMemes = await prisma.meme.findMany({
      where: {
        id: { not: memeId },
        status: 'approved',
        OR: [
          { tags: { contains: meme.tags.split(',')[0] } },
          { createdById: meme.createdById },
        ],
      },
      orderBy: { voteCount: 'desc' },
      take: 4,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        meme,
        relatedMemes,
      },
    })
  } catch (error) {
    console.error('获取梗详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取梗详情失败' },
      { status: 500 }
    )
  }
}
