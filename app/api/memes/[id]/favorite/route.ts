import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 收藏/取消收藏
 * POST /api/memes/[id]/favorite
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
    const { action } = body

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "无效的操作" },
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

    if (action === 'add') {
      // 检查是否已收藏
      const existing = await prisma.favorite.findUnique({
        where: {
          memeId_userId: {
            memeId,
            userId,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: "已经收藏过了" },
          { status: 400 }
        )
      }

      // 创建收藏
      await prisma.favorite.create({
        data: {
          memeId,
          userId,
        },
      })

      return NextResponse.json({
        success: true,
        data: { favorited: true },
        message: "收藏成功",
      })
    } else {
      // 取消收藏
      await prisma.favorite.delete({
        where: {
          memeId_userId: {
            memeId,
            userId,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: { favorited: false },
        message: "已取消收藏",
      })
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    return NextResponse.json(
      { success: false, error: '收藏操作失败' },
      { status: 500 }
    )
  }
}

/**
 * 检查收藏状态
 * GET /api/memes/[id]/favorite
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: { favorited: false },
      })
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        memeId_userId: {
          memeId,
          userId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { favorited: !!favorite },
    })
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    return NextResponse.json(
      { success: false, error: '检查收藏状态失败' },
      { status: 500 }
    )
  }
}
