"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  username: string
  avatar: string | null
  createdAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include", // 确保发送 Cookie
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.data.user)
          }
        }
      } catch (error) {
        console.error("获取用户信息失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/"
  }

  return { user, loading, logout }
}
