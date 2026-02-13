"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { useAuth } from "@/lib/auth"
import { Avatar } from "@/components/ui/avatar"

interface Vote {
  id: string
  createdAt: string
  meme: {
    id: string
    title: string
    content: string
    voteCount: number
    createdBy: {
      username: string
    }
  }
}

interface Meme {
  id: string
  title: string
  content: string
  voteCount: number
  status?: string
  createdAt: string
  createdBy?: {
    username: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"votes" | "memes" | "favorites">("votes")
  const [votes, setVotes] = useState<Vote[]>([])
  const [memes, setMemes] = useState<Meme[]>([])
  const [favorites, setFavorites] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/api/auth/login")
      return
    }

    if (user) {
      fetchUserData()
    }
  }, [user, authLoading, router])

  async function fetchUserData() {
    setLoading(true)
    try {
      // 获取投票历史
      const votesRes = await fetch("/api/user/votes", { credentials: "include" })
      const votesData = await votesRes.json()
      if (votesData.success) {
        setVotes(votesData.data.votes)
      }

      // 获取投稿记录
      const memesRes = await fetch("/api/user/memes", { credentials: "include" })
      const memesData = await memesRes.json()
      if (memesData.success) {
        setMemes(memesData.data.memes)
      }

      // 获取收藏列表
      const favoritesRes = await fetch("/api/user/favorites", { credentials: "include" })
      const favoritesData = await favoritesRes.json()
      if (favoritesData.success) {
        setFavorites(favoritesData.data.memes)
      }
    } catch (error) {
      console.error("获取用户数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* 用户信息卡片 */}
          <div className="mb-8 rounded-2xl border border-purple-200/50 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-purple-800/50 dark:bg-gray-800/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                    src={user.avatar}
                    alt={user.username}
                    size="lg"
                    className="border-4 border-purple-200 dark:border-purple-800"
                  />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.username}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    加入时间：{new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-purple-600 dark:text-purple-400">
                      投票数：{votes.length}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      投稿数：{memes.length}
                    </span>
                    <span className="text-pink-600 dark:text-pink-400">
                      收藏数：{favorites.length}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* Tab切换 */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("votes")}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                activeTab === "votes"
                  ? "bg-purple-600 text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              我的投票 ({votes.length})
            </button>
            <button
              onClick={() => setActiveTab("memes")}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                activeTab === "memes"
                  ? "bg-purple-600 text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              我的投稿 ({memes.length})
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`rounded-full px-6 py-2 font-medium transition-all ${
                activeTab === "favorites"
                  ? "bg-pink-600 text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              我的收藏 ({favorites.length})
            </button>
          </div>

          {/* 内容列表 */}
          <div className="space-y-4">
            {activeTab === "votes" ? (
              votes.length === 0 ? (
                <div className="rounded-xl bg-white/50 p-8 text-center dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400">还没有投票记录</p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-purple-600 hover:underline dark:text-purple-400"
                  >
                    去投票 →
                  </Link>
                </div>
              ) : (
                votes.map((vote) => (
                  <Link
                    key={vote.id}
                    href={`/meme/${vote.meme.id}`}
                    className="block rounded-xl border border-purple-200/50 bg-white/80 p-4 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-purple-800/50 dark:bg-gray-800/80"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {vote.meme.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {vote.meme.content}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>{vote.meme.voteCount} 票</span>
                      <span>作者：{vote.meme.createdBy.username}</span>
                      <span>投票时间：{new Date(vote.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                ))
              )
            ) : activeTab === "favorites" ? (
              favorites.length === 0 ? (
                <div className="rounded-xl bg-white/50 p-8 text-center dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400">还没有收藏</p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-pink-600 hover:underline dark:text-pink-400"
                  >
                    去发现好梗 →
                  </Link>
                </div>
              ) : (
                favorites.map((meme) => (
                  <Link
                    key={meme.id}
                    href={`/meme/${meme.id}`}
                    className="block rounded-xl border border-pink-200/50 bg-white/80 p-4 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-pink-800/50 dark:bg-gray-800/80"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {meme.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {meme.content}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>{meme.voteCount} 票</span>
                      <span>作者：{meme.createdBy?.username || "未知"}</span>
                      <span>{new Date(meme.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                ))
              )
            ) : memes.length === 0 ? (
              <div className="rounded-xl bg-white/50 p-8 text-center dark:bg-gray-800/50">
                <p className="text-gray-500 dark:text-gray-400">还没有投稿</p>
                <Link
                  href="/submit"
                  className="mt-4 inline-block text-green-600 hover:underline dark:text-green-400"
                >
                  去投稿 →
                </Link>
              </div>
            ) : (
              memes.map((meme) => (
                <Link
                  key={meme.id}
                  href={`/meme/${meme.id}`}
                  className="block rounded-xl border border-purple-200/50 bg-white/80 p-4 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-purple-800/50 dark:bg-gray-800/80"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {meme.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {meme.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>{meme.voteCount} 票</span>
                        <span>{new Date(meme.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    <span
                      className={`ml-4 rounded-full px-2 py-1 text-xs ${
                        meme.status === "approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : meme.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {meme.status === "approved"
                        ? "已通过"
                        : meme.status === "pending"
                        ? "审核中"
                        : "已拒绝"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
