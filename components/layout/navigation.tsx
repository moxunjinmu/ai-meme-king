"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { useAuth } from "@/lib/auth"
import { Avatar } from "@/components/ui/avatar"

export function Navigation() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-200/50 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🎭</span>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
            AI梗王之王
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
          >
            搜索
          </Link>
          <Link
            href="/rankings"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
          >
            排行榜
          </Link>
          <Link
            href="/chat"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400"
          >
            AI 聊天
          </Link>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full p-2 transition-all hover:bg-purple-100 dark:hover:bg-purple-900"
              aria-label="切换主题"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                href="/profile"
                className="flex items-center space-x-2 rounded-full bg-purple-100 px-3 py-1.5 transition-all hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50"
              >
                <Avatar src={user.avatar} alt={user.username} size="sm" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {user.username}
                </span>
              </Link>
              <button
                onClick={logout}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                退出
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/login"
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 animate-pulse-slow"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              登录
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-pink-500"></span>
              </span>
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
