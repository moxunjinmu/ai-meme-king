"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/components/ui/toast"
import { InlineLoginPrompt } from "@/components/auth/login-prompt"
import { Avatar } from "@/components/ui/avatar"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    avatar: string | null
  }
  replies: Comment[]
  _count: {
    replies: number
  }
}

interface CommentSectionProps {
  memeId: string
}

export function CommentSection({ memeId }: CommentSectionProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [memeId])

  async function fetchComments() {
    setLoading(true)
    try {
      const response = await fetch(`/api/memes/${memeId}/comments`, {
        credentials: "include",
      })
      const result = await response.json()
      if (result.success) {
        setComments(result.data.comments)
      }
    } catch (error) {
      console.error("获取评论失败:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    if (!content.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/memes/${memeId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const result = await response.json()
      if (result.success) {
        setContent("")
        showToast("评论成功", "success")
        fetchComments()
      } else {
        showToast(result.error || "评论失败", "error")
      }
    } catch (error) {
      showToast("网络错误", "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">评论</h3>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? "写下你的评论..." : "请先登录后评论"}
          maxLength={500}
          rows={3}
          disabled={!user || submitting}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">{content.length}/500</span>
          <button
            type="submit"
            disabled={!user || submitting || !content.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "发送中..." : "发表评论"}
          </button>
        </div>
      </form>

      {/* 登录提示 */}
      {showLoginPrompt && (
        <div className="mb-6">
          <InlineLoginPrompt onClose={() => setShowLoginPrompt(false)} />
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">
            暂无评论，来说两句吧~
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-gray-100 bg-white/50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-2">
                <Avatar src={comment.user.avatar} alt={comment.user.username} size="md" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>

              {/* 回复 */}
              {comment.replies.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-purple-200 pl-4 dark:border-purple-800">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {reply.user.username}
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {reply.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
