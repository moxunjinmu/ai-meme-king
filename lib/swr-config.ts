import useSWR, { SWRConfiguration } from "swr"

// 基础fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: "include", // 确保发送 Cookie
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || "请求失败")
  }
  return data.data
}

// SWR全局配置
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
}

// 通用useSWR包装
export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    ...swrConfig,
    ...config,
  })
}

// 获取梗列表
export function useMemes(sort: "hot" | "new" = "hot", tag?: string) {
  const params = new URLSearchParams()
  params.set("sort", sort)
  params.set("limit", "12")
  if (tag) params.set("tag", tag)

  return useApi<{
    memes: any[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>(`/api/memes?${params.toString()}`)
}

// 获取梗详情
export function useMemeDetail(id: string) {
  return useApi<{
    meme: any
    relatedMemes: any[]
  }>(id ? `/api/memes/${id}` : null)
}

// 获取排行榜
export function useRankings(type: "today" | "alltime" | "rising") {
  return useApi<{ memes: any[] }>(`/api/rankings?type=${type}&limit=10`)
}

// 获取用户投票历史
export function useUserVotes() {
  return useApi<{ votes: any[] }>("/api/user/votes")
}

// 获取用户投稿
export function useUserMemes() {
  return useApi<{ memes: any[] }>("/api/user/memes")
}
