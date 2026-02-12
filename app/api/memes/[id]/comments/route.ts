import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取梗的评论列表
 * GET /api/memes/[id]/comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id

    const comments = await prisma.comment.findMany({
      where: {
        memeId,
        parentId: null, // 只获取一级评论
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { comments },
    })
  } catch (error) {
    console.error('获取评论失败:', error)
    return NextResponse.json(
      { success: false, error: '获取评论失败' },
      { status: 500 }
    )
  }
}

/**
 * 发表评论
 * POST /api/memes/[id]/comments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parentId } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: "评论内容不能为空" },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: "评论内容不能超过500字" },
        { status: 400 }
      )
    }

    // 检查梗是否存在
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
    })

    if (!meme) {
      return NextResponse.json(
        { success: false, error: "梗不存在" },
        { status: 404 }
      )
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        memeId,
        userId,
        parentId: parentId || null,
      },
      include: {
        user: {
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
      data: { comment },
      message: "评论成功",
    })
  } catch (error) {
    console.error('发表评论失败:', error)
    return NextResponse.json(
      { success: false, error: '发表评论失败' },
      { status: 500 }
    )
  }
}
