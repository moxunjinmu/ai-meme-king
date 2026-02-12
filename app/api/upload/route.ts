import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

/**
 * 图片上传
 * POST /api/upload
 * Body: FormData with image field
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

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: "请选择图片" },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "仅支持 JPEG、PNG、GIF、WebP 格式" },
        { status: 400 }
      )
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "图片大小不能超过 5MB" },
        { status: 400 }
      )
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成唯一文件名
    const ext = path.extname(file.name) || '.png'
    const filename = `${uuidv4()}${ext}`

    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'memes')
    await mkdir(uploadDir, { recursive: true })

    // 保存文件
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 返回图片URL
    const imageUrl = `/uploads/memes/${filename}`

    return NextResponse.json({
      success: true,
      data: { imageUrl },
      message: "上传成功",
    })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { success: false, error: '上传失败' },
      { status: 500 }
    )
  }
}
