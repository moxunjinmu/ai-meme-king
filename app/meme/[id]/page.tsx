"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { CommentSection } from "@/components/comments/comment-section"
import { ShareButton } from "@/components/memes/share-button"
import { useAuth } from "@/lib/auth"

interface Meme {
  id: string
  title: string
  content: string
  tags: string | null
  imageUrl: string | null
  voteCount: number
  createdAt: string
  createdBy: {
    id: string
    username: string
    avatar: string | null
  }
}

interface RelatedMeme {
  id: string
  title: string
  voteCount: number
  createdBy: {
    id: string
    username: string
  }
}

export default function MemeDetailPage() {
  const params = useParams()
  const memeId = params.id as string
  const { user } = useAuth()

  const [meme, setMeme] = useState<Meme | null>(null)
  const [relatedMemes, setRelatedMemes] = useState<RelatedMeme[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)

  useEffect(() => {
    async function fetchMemeDetail() {
      try {
        const response = await fetch(`/api/memes/${memeId}`, { credentials: "include" })
        const result = await response.json()

        if (result.success) {
          setMeme(result.data.meme)
          setRelatedMemes(result.data.relatedMemes)
        }
      } catch (error) {
        console.error("获取梗详情失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMemeDetail()
  }, [memeId])

  useEffect(() => {
    async function checkVoteStatus() {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/memes/${memeId}/vote?userId=${user.id}`, { credentials: "include" })
        const result = await response.json()
        if (result.success) {
          setVoted(result.data.voted)
        }
      } catch (error) {
        console.error("检查投票状态失败:", error)
      }
    }

    checkVoteStatus()
  }, [memeId, user?.id])

  const handleVote = async () => {
    if (!user?.id) {
      window.location.href = "/api/auth/login"
      return
    }

    setVoteLoading(true)
    try {
      const response = await fetch(`/api/memes/${memeId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: voted ? "downvote" : "upvote",
          userId: user.id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setVoted(result.data.voted)
        setMeme(prev => prev ? { ...prev, voteCount: result.data.voted ? prev.voteCount + 1 : prev.voteCount - 1 } : null)
      }
    } catch (error) {
      console.error("投票失败:", error)
    } finally {
      setVoteLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </main>
    )
  }

  if (!meme) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-gray-600 dark:text-gray-400">梗不存在或已被删除</p>
            <Link href="/" className="mt-4 inline-block text-purple-600 hover:underline">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* 返回链接 */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
          >
            ← 返回首页
          </Link>

          {/* 主内容卡片 */}
          <article className="overflow-hidden rounded-2xl border border-purple-200/50 bg-white/90 shadow-xl backdrop-blur-sm dark:border-purple-800/50 dark:bg-gray-800/90">
            {/* 头部 */}
            <div className="border-b border-gray-100 p-6 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {meme.createdBy.avatar && (
                  <img
                    src={meme.createdBy.avatar}
                    alt={meme.createdBy.username}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {meme.createdBy.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(meme.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {meme.title}
              </h1>

              {/* 图片 */}
              {meme.imageUrl && (
                <div className="mt-4">
                  <img
                    src={meme.imageUrl}
                    alt={meme.title}
                    className="max-h-96 w-full rounded-xl object-contain"
                  />
                </div>
              )}

              <p className="mt-4 whitespace-pre-wrap text-lg text-gray-700 dark:text-gray-300">
                {meme.content}
              </p>

              {/* 标签 */}
              {meme.tags && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {meme.tags.split(",").map((tag) => (
                    <Link
                      key={tag}
                      href={`/?tag=${tag.trim()}`}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 transition-colors hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900"
                    >
                      {tag.trim()}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-6 dark:border-gray-700 dark:bg-gray-900/50">
              <button
                onClick={handleVote}
                disabled={voteLoading}
                className={`flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-all ${
                  voted
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                } ${voteLoading ? "opacity-50" : ""}`}
              >
                <span className="text-xl">{voted ? "✓" : "👍"}</span>
                <span>{voted ? "已投票" : "投票"}</span>
              </button>

              <ShareButton memeId={meme.id} title={meme.title} />

              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {meme.voteCount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">票</p>
              </div>
            </div>
          </article>

          {/* 相关推荐 */}
          {relatedMemes.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                相关推荐
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedMemes.map((related) => (
                  <Link
                    key={related.id}
                    href={`/meme/${related.id}`}
                    className="group rounded-xl border border-purple-200/50 bg-white/80 p-4 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-purple-800/50 dark:bg-gray-800/80"
                  >
                    <h3 className="line-clamp-2 font-medium text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                      {related.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {related.voteCount} 票 · {related.createdBy.username}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 评论区 */}
          <CommentSection memeId={memeId} />
        </div>
      </div>
    </main>
  )
}
