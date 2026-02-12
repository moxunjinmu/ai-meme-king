"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/components/ui/toast"

interface Meme {
  id: string
  title: string
  content: string
  status: string
  voteCount: number
  createdAt: string
  createdBy: {
    id: string
    username: string
  }
  _count: {
    votes: number
    comments: number
  }
}

export default function AdminMemesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminMemesContent />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </main>
  )
}

function AdminMemesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState(searchParams.get("status") || "all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/api/auth/login")
      return
    }

    if (user) {
      fetchMemes()
    }
  }, [user, authLoading, router, activeStatus])

  async function fetchMemes() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/memes?status=${activeStatus}`)
      const result = await response.json()

      if (response.status === 403) {
        showToast("无权访问", "error")
        router.push("/")
        return
      }

      if (result.success) {
        setMemes(result.data.memes)
      }
    } catch (error) {
      console.error("获取数据失败:", error)
      showToast("获取数据失败", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(memeId: string) {
    try {
      const response = await fetch(`/api/admin/memes/${memeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      const result = await response.json()

      if (result.success) {
        showToast("已通过审核", "success")
        fetchMemes()
      } else {
        showToast(result.error || "操作失败", "error")
      }
    } catch (error) {
      showToast("网络错误", "error")
    }
  }

  async function handleReject(memeId: string) {
    try {
      const response = await fetch(`/api/admin/memes/${memeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      const result = await response.json()

      if (result.success) {
        showToast("已拒绝", "success")
        fetchMemes()
      } else {
        showToast(result.error || "操作失败", "error")
      }
    } catch (error) {
      showToast("网络错误", "error")
    }
  }

  async function handleDelete(memeId: string) {
    if (!confirm("确定要删除这个梗吗？此操作不可恢复。")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/memes/${memeId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        showToast("删除成功", "success")
        fetchMemes()
      } else {
        showToast(result.error || "删除失败", "error")
      }
    } catch (error) {
      showToast("网络错误", "error")
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🗂️ 梗管理
            </h1>
            <Link
              href="/admin"
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← 返回后台
            </Link>
          </div>

          {/* 状态筛选 */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: "all", label: "全部", count: null },
              { key: "pending", label: "待审核", count: null },
              { key: "approved", label: "已通过", count: null },
              { key: "rejected", label: "已拒绝", count: null },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setActiveStatus(status.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeStatus === status.key
                    ? "bg-purple-600 text-white"
                    : "bg-white/50 text-gray-700 hover:bg-white dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* 梗列表 */}
          <div className="space-y-4">
            {memes.length === 0 ? (
              <div className="rounded-xl bg-white/50 p-12 text-center dark:bg-gray-800/50">
                <p className="text-gray-500 dark:text-gray-400">
                  没有找到符合条件的梗
                </p>
              </div>
            ) : (
              memes.map((meme) => (
                <div
                  key={meme.id}
                  className="rounded-xl border border-purple-200/50 bg-white/90 p-6 dark:border-purple-800/50 dark:bg-gray-800/90"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {meme.title}
                        </h3>
                        <StatusBadge status={meme.status} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">
                        {meme.content}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span>作者：{meme.createdBy.username}</span>
                        <span>{meme._count.votes} 票</span>
                        <span>{meme._count.comments} 评论</span>
                        <span>
                          {new Date(meme.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {meme.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(meme.id)}
                            className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition-all hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(meme.id)}
                            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          >
                            拒绝
                          </button>
                        </>
                      )}
                      <Link
                        href={`/meme/${meme.id}`}
                        target="_blank"
                        className="rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        查看
                      </Link>
                      <button
                        onClick={() => handleDelete(meme.id)}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const labels = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
  }

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        classes[status as keyof typeof classes]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  )
}
