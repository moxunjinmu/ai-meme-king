"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { useToast } from "@/components/ui/toast"

export default function SubmitPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showToast("仅支持 JPEG、PNG、GIF、WebP 格式", "error")
      return
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showToast("图片大小不能超过 5MB", "error")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImageUrl(result.data.imageUrl)
        showToast("图片上传成功", "success")
      } else {
        showToast(result.error || "上传失败", "error")
      }
    } catch (err) {
      showToast("上传失败，请重试", "error")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/memes/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, tags, imageUrl }),
      })

      const result = await response.json()

      if (result.success) {
        showToast("投稿成功！", "success")
        router.push("/")
      } else {
        showToast(result.error || "投稿失败", "error")
      }
    } catch (err) {
      showToast("网络错误，请稍后重试", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900 dark:to-teal-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-center text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            📝 投稿新梗
          </h1>

          <div className="rounded-2xl border border-green-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:border-green-800/50 dark:bg-gray-800/80">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  标题 *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="给你的梗起个有趣的标题"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {title.length}/100
                </p>
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  内容 *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={500}
                  required
                  rows={5}
                  placeholder="写下你的梗..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {content.length}/500
                </p>
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  标签
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="AI, 编程, 幽默（用逗号分隔）"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* 图片上传 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  图片
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="预览"
                      className="max-h-48 rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 transition-all hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-green-500 dark:hover:bg-green-900/20"
                  >
                    {uploading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">上传中...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">📷</span>
                        <span className="text-gray-600 dark:text-gray-400">点击上传图片</span>
                      </>
                    )}
                  </button>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  支持 JPEG、PNG、GIF、WebP，最大 5MB
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 px-6 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                >
                  {loading ? "提交中..." : "提交投稿"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
