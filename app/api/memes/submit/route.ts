import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 提交新梗
 * POST /api/memes/submit
 * Body: { title: string, content: string, tags: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 从 cookie 获取用户ID
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, tags } = body

    // 验证参数
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "标题和内容不能为空" },
        { status: 400 }
      )
    }

    if (title.length > 100) {
      return NextResponse.json(
        { success: false, error: "标题不能超过100个字符" },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: "内容不能超过500个字符" },
        { status: 400 }
      )
    }

    // 创建梗
    const meme = await prisma.meme.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags?.trim() || "",
        createdById: userId,
        status: "approved", // 暂时自动通过，后续可以改为 pending
      },
    })

    return NextResponse.json({
      success: true,
      data: { meme },
      message: "投稿成功！",
    })
  } catch (error) {
    console.error("投稿失败:", error)
    return NextResponse.json(
      { success: false, error: "投稿失败" },
      { status: 500 }
    )
  }
}
