import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取聊天记录
 * GET /api/chat/[characterId]/messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const userId = request.cookies.get("user_id")?.value
    const characterId = params.characterId

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        characterId,
        userId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        character: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { messages },
    })
  } catch (error) {
    console.error('获取聊天记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取聊天记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 发送消息
 * POST /api/chat/[characterId]/messages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const userId = request.cookies.get("user_id")?.value
    const characterId = params.characterId

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: "消息不能为空" },
        { status: 400 }
      )
    }

    // 获取角色信息
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      return NextResponse.json(
        { success: false, error: "角色不存在" },
        { status: 404 }
      )
    }

    // 保存用户消息
    const userMessage = await prisma.chatMessage.create({
      data: {
        characterId,
        userId,
        message: message.trim(),
        isFromAI: false,
      },
    })

    // 生成AI回复（模拟）
    const aiReply = generateAIReply(message, character.personality)

    // 保存AI回复
    const aiMessage = await prisma.chatMessage.create({
      data: {
        characterId,
        userId,
        message: aiReply,
        isFromAI: true,
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
      },
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    return NextResponse.json(
      { success: false, error: '发送消息失败' },
      { status: 500 }
    )
  }
}

/**
 * 根据角色性格生成AI回复（模拟）
 */
function generateAIReply(userMessage: string, personality: string): string {
  const replies = [
    "哈哈，这确实很有趣！",
    "你说的这个梗我知道，太经典了！",
    "等等，这是什么新梗吗？",
    "作为一个AI，我觉得这个梗很有创意！",
    "这个梗可以火！",
    "太有梗了，我要记下来！",
    "哈哈哈，笑不活了！",
    "这个梗有点东西啊！",
    "我觉得这个梗可以出圈！",
    "这届网友太有才了！",
  ]

  // 根据消息内容选择不同的回复
  const index = userMessage.length % replies.length
  return replies[index]
}
