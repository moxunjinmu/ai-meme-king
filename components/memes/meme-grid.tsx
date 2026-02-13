"use client"

import { useEffect, useState, useCallback } from "react"
import { MemeCard } from "./meme-card"

interface Meme {
  id: string
  title: string
  content: string
  tags: string | null
  voteCount: number
  createdBy: {
    id: string
    username: string
    avatar: string | null
  }
}

interface MemeGridProps {
  sort?: "hot" | "new"
  tag?: string
}

export function MemeGrid({ sort = "hot", tag }: MemeGridProps) {
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchMemes = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams()
      params.set("sort", sort)
      params.set("page", pageNum.toString())
      params.set("limit", "12")
      if (tag) params.set("tag", tag)

      const response = await fetch(`/api/memes?${params.toString()}`, {
        credentials: "include",
      })
      const result = await response.json()

      if (result.success) {
        const newMemes = result.data.memes
        if (append) {
          setMemes((prev) => [...prev, ...newMemes])
        } else {
          setMemes(newMemes)
        }
        setHasMore(newMemes.length === 12)
      } else {
        setError(result.error || "获取数据失败")
      }
    } catch (err) {
      setError("网络错误")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [sort, tag])

  // 初始加载
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchMemes(1, false)
  }, [fetchMemes, sort, tag])

  // 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById("scroll-sentinel")
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore])

  // 加载更多数据
  useEffect(() => {
    if (page > 1) {
      fetchMemes(page, true)
    }
  }, [page, fetchMemes])

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-8 text-center dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => fetchMemes(1, false)}
          className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
        >
          重试
        </button>
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400">暂无梗数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {memes.map((meme) => (
          <MemeCard key={meme.id} meme={meme} />
        ))}
      </div>

      {/* 加载更多指示器 */}
      <div id="scroll-sentinel" className="flex justify-center py-4">
        {loadingMore && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            <span>加载更多...</span>
          </div>
        )}
        {!hasMore && memes.length > 0 && (
          <p className="text-gray-400">已经到底了</p>
        )}
      </div>
    </div>
  )
}
