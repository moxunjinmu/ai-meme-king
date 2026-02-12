"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { MemeCard } from "@/components/memes/meme-card"

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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchContent />
    </Suspense>
  )
}

function SearchLoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-center text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔍 搜索梗
          </h1>
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </main>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return

    setLoading(true)
    setSearched(true)
    setSearchQuery(searchTerm)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`)
      const result = await response.json()

      if (result.success) {
        setMemes(result.data.memes)
      }
    } catch (error) {
      console.error("搜索失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
    // 更新URL
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-center text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔍 搜索梗
          </h1>

          {/* 搜索框 */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索梗标题、内容或标签..."
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
              >
                {loading ? "搜索中..." : "搜索"}
              </button>
            </div>
          </form>

          {/* 搜索结果 */}
          {searched && (
            <div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {loading ? (
                  "搜索中..."
                ) : (
                  <>
                    搜索 <span className="font-medium text-purple-600">"{searchQuery}"</span> 找到{" "}
                    <span className="font-medium">{memes.length}</span> 个结果
                  </>
                )}
              </p>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
                    />
                  ))}
                </div>
              ) : memes.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {memes.map((meme) => (
                    <MemeCard key={meme.id} meme={meme} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white/50 p-12 text-center dark:bg-gray-800/50">
                  <p className="mb-4 text-6xl">😕</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    没有找到与 "{searchQuery}" 相关的梗
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-purple-600 hover:underline dark:text-purple-400"
                  >
                    返回首页看看热门梗 →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 热门标签 */}
          {!searched && (
            <div className="rounded-2xl border border-purple-200/50 bg-white/80 p-6 dark:border-purple-800/50 dark:bg-gray-800/80">
              <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                热门标签
              </h2>
              <div className="flex flex-wrap gap-2">
                {["AI", "编程", "幽默", "职场", "ChatGPT", "Claude", "吐槽"].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setQuery(tag)
                        performSearch(tag)
                        window.history.pushState({}, "", `/search?q=${encodeURIComponent(tag)}`)
                      }}
                      className="rounded-full bg-purple-100 px-4 py-2 text-sm text-purple-700 transition-all hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
