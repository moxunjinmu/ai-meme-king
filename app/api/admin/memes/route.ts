import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/**
 * 获取梗列表（管理员）
 * GET /api/admin/memes?status=pending&page=1&limit=10
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = status === 'all' ? {} : { status }

    const memes = await prisma.meme.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    })

    const total = await prisma.meme.count({ where })

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
      { success: false, error: '获取梗列表失败' },
      { status: 500 }
    )
  }
}
