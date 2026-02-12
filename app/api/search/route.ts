import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 搜索梗
 * GET /api/search?q=关键词
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: '请输入搜索关键词' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim()

    // 搜索标题、内容和标签
    const memes = await prisma.meme.findMany({
      where: {
        status: 'approved',
        OR: [
          { title: { contains: searchTerm } },
          { content: { contains: searchTerm } },
          { tags: { contains: searchTerm } },
        ],
      },
      orderBy: { voteCount: 'desc' },
      take: 20,
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
        memes,
        query: searchTerm,
        total: memes.length,
      },
    })
  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      { success: false, error: '搜索失败' },
      { status: 500 }
    )
  }
}
