import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取排行榜数据
 * GET /api/rankings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'today' // today, alltime, rising
    const limit = parseInt(searchParams.get('limit') || '10')

    let memes: any[] = []

    if (type === 'today') {
      // 今日梗王：最近24小时内创建的梗，按票数排序
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      memes = await prisma.meme.findMany({
        where: {
          status: 'approved',
          createdAt: {
            gte: yesterday,
          },
        },
        orderBy: { voteCount: 'desc' },
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
      })
    } else if (type === 'alltime') {
      // 历史梗王：所有时间按票数排序
      memes = await prisma.meme.findMany({
        where: {
          status: 'approved',
        },
        orderBy: { voteCount: 'desc' },
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
      })
    } else if (type === 'rising') {
      // 新星榜：最近7天内创建的梗，按票数排序
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)

      memes = await prisma.meme.findMany({
        where: {
          status: 'approved',
          createdAt: {
            gte: lastWeek,
          },
        },
        orderBy: { voteCount: 'desc' },
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
      })
    }

    return NextResponse.json({
      success: true,
      data: { memes },
    })
  } catch (error) {
    console.error('获取排行榜失败:', error)
    return NextResponse.json(
      { success: false, error: '获取排行榜失败' },
      { status: 500 }
    )
  }
}
