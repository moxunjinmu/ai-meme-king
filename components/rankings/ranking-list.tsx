"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Meme {
  id: string
  title: string
  content: string
  voteCount: number
  createdBy: {
    id: string
    username: string
    avatar: string | null
  }
}

interface RankingListProps {
  type: "today" | "alltime" | "rising"
  title: string
  icon: string
  colorClass: string
}

export function RankingList({ type, title, icon, colorClass }: RankingListProps) {
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRankings() {
      try {
        const response = await fetch(`/api/rankings?type=${type}&limit=10`, {
          credentials: "include",
        })
        const result = await response.json()
        if (result.success) {
          setMemes(result.data.memes)
        }
      } catch (error) {
        console.error("获取排行榜失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [type])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        暂无数据
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {memes.map((meme, index) => (
        <Link
          key={meme.id}
          href={`/meme/${meme.id}`}
          className="group flex items-center gap-3 rounded-xl bg-white/50 p-3 transition-all hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-700/80"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold ${
              index < 3
                ? `${colorClass} text-white`
                : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {meme.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {meme.voteCount} 票 · {meme.createdBy.username}
            </p>
          </div>
          {index < 3 && <span className="text-xl">{icon}</span>}
        </Link>
      ))}
    </div>
  )
}
