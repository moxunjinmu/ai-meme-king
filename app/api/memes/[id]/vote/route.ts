import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 投票/取消投票
 * POST /api/memes/[id]/vote
 * Body: { action: 'upvote' | 'downvote', userId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id
    const body = await request.json()
    const { action, userId } = body

    // 验证参数
    if (!memeId || !action || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查梗是否存在
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
    })

    if (!meme) {
      return NextResponse.json(
        { success: false, error: '梗不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已投票
    const existingVote = await prisma.vote.findUnique({
      where: {
        memeId_userId: {
          memeId,
          userId,
        },
      },
    })

    if (action === 'upvote') {
      if (existingVote) {
        return NextResponse.json(
          { success: false, error: '已经投过票了' },
          { status: 400 }
        )
      }

      // 创建投票并更新票数
      await prisma.$transaction([
        prisma.vote.create({
          data: {
            memeId,
            userId,
          },
        }),
        prisma.meme.update({
          where: { id: memeId },
          data: {
            voteCount: {
              increment: 1,
            },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: { voted: true },
        message: '投票成功',
      })
    } else if (action === 'downvote') {
      if (!existingVote) {
        return NextResponse.json(
          { success: false, error: '还没有投过票' },
          { status: 400 }
        )
      }

      // 删除投票并更新票数
      await prisma.$transaction([
        prisma.vote.delete({
          where: {
            memeId_userId: {
              memeId,
              userId,
            },
          },
        }),
        prisma.meme.update({
          where: { id: memeId },
          data: {
            voteCount: {
              decrement: 1,
            },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: { voted: false },
        message: '取消投票成功',
      })
    }

    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    )
  } catch (error) {
    console.error('投票失败:', error)
    return NextResponse.json(
      { success: false, error: '投票失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

/**
 * 检查投票状态
 * GET /api/memes/[id]/vote?userId=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memeId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const vote = await prisma.vote.findUnique({
      where: {
        memeId_userId: {
          memeId,
          userId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { voted: !!vote },
    })
  } catch (error) {
    console.error('检查投票状态失败:', error)
    return NextResponse.json(
      { success: false, error: '检查投票状态失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
