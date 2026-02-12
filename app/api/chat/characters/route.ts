import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * 获取AI角色列表
 * GET /api/chat/characters
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value

    // 获取系统预设角色和当前用户创建的角色
    const characters = await prisma.aICharacter.findMany({
      where: {
        OR: [
          { createdById: 'system' },
          ...(userId ? [{ createdById: userId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { characters },
    })
  } catch (error) {
    console.error('获取AI角色失败:', error)
    return NextResponse.json(
      { success: false, error: '获取AI角色失败' },
      { status: 500 }
    )
  }
}

/**
 * 创建AI角色
 * POST /api/chat/characters
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, personality, avatar } = body

    if (!name || !personality) {
      return NextResponse.json(
        { success: false, error: "名称和性格描述不能为空" },
        { status: 400 }
      )
    }

    const character = await prisma.aICharacter.create({
      data: {
        name: name.trim(),
        personality: personality.trim(),
        avatar: avatar || null,
        createdById: userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: { character },
      message: "创建成功",
    })
  } catch (error) {
    console.error('创建AI角色失败:', error)
    return NextResponse.json(
      { success: false, error: '创建AI角色失败' },
      { status: 500 }
    )
  }
}
