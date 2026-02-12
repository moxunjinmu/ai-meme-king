import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

/**
 * 更新梗状态（审核）
 * PATCH /api/admin/memes/[id]
 * Body: { status: 'approved' | 'rejected' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const memeId = id
    const body = await request.json()
    const { status } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "无效的状态" },
        { status: 400 }
      )
    }

    // 更新梗状态
    const meme = await prisma.meme.update({
      where: { id: memeId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      data: { meme },
      message: status === 'approved' ? '已通过审核' : '已拒绝',
    })
  } catch (error) {
    console.error('审核失败:', error)
    return NextResponse.json(
      { success: false, error: '审核失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除梗
 * DELETE /api/admin/memes/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memeId } = await params

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

    // 删除梗（级联删除投票、评论等）
    await prisma.meme.delete({
      where: { id: memeId },
    })

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除失败:', error)
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    )
  }
}
