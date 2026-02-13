# SecondMe OAuth 2.0 认证配置手册

> 一键识别：看到 `go.second.me` 或 `app.mindos.com/gate/lab` 就是 SecondMe 认证

---

## 1. 核心配置（必须）

### 环境变量 `.env`
```bash
# 客户端配置（前端可访问，必须 NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_SECONDME_CLIENT_ID=你的client_id
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/api/auth/callback

# 服务端配置（敏感，不可暴露）
SECONDME_CLIENT_SECRET=你的client_secret
```

### 数据库 User 模型（必需字段）
```prisma
model User {
  id           String   @id
  username     String
  avatar       String?
  accessToken  String   // 必须：存储 access_token
  refreshToken String?  // 可选：刷新令牌
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 2. API 端点速查

| 用途 | 方法 | URL |
|------|------|-----|
| **授权页面** | GET | `https://go.second.me/oauth/` |
| **获取 Token** | POST | `https://app.mindos.com/gate/lab/api/oauth/token/code` |
| **获取用户信息** | GET | `https://app.mindos.com/gate/lab/api/secondme/user/info` |

---

## 3. 三步认证流程

```
用户点击登录 → /api/auth/login → 重定向到 SecondMe 授权页
                                        ↓
                              用户授权后回调 /api/auth/callback?code=xxx&state=xxx
                                        ↓
                              用 code 换 token，再获取用户信息，存入数据库
```

---

## 4. 代码模板（复制即用）

### 步骤1：发起登录 `/api/auth/login/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: NextRequest) {
  const state = generateState()

  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI!,
    response_type: "code",
    state: state,
  })

  return NextResponse.redirect(`https://go.second.me/oauth/?${params}`)
}
```

### 步骤2：处理回调 `/api/auth/callback/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  // 验证 state
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=invalid_request", request.url))
  }

  cookieStore.delete("oauth_state")

  // 换取 Token（注意：x-www-form-urlencoded 格式）
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI!,
    client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID!,
    client_secret: process.env.SECONDME_CLIENT_SECRET!,
  })

  const tokenRes = await fetch("https://app.mindos.com/gate/lab/api/oauth/token/code", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.code !== 0) throw new Error(tokenData.message)

  // 注意字段名：accessToken 不是 access_token
  const { accessToken, refreshToken, expiresIn } = tokenData.data

  // 获取用户信息
  const userRes = await fetch("https://app.mindos.com/gate/lab/api/secondme/user/info", {
    headers: { "Authorization": `Bearer ${accessToken}` },
  })

  const userData = await userRes.json()
  if (userData.code !== 0) throw new Error(userData.message)

  const { id, name, avatar } = userData.data
  const userId = id || `user_${Date.now()}`
  const username = name || '用户'

  // 存入数据库
  await prisma.user.upsert({
    where: { id: userId },
    update: { username, avatar, accessToken, refreshToken },
    create: { id: userId, username, avatar, accessToken, refreshToken },
  })

  // 设置 Cookie 并重定向（必须在响应对象上设置）
  const response = NextResponse.redirect(new URL("/", request.url))
  response.cookies.set("access_token", accessToken, {
    httpOnly: true, secure: false, sameSite: "lax", path: "/",
    maxAge: expiresIn || 604800,
  })
  response.cookies.set("user_id", userId, {
    httpOnly: true, secure: false, sameSite: "lax", path: "/",
    maxAge: 604800,
  })

  return response
}
```

### 步骤3：获取当前用户 `/api/auth/me/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("user_id")?.value

  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatar: true, createdAt: true },
  })

  if (!user) {
    return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: { user } })
}
```

### 步骤4：前端 Hook `lib/auth.ts`
```typescript
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
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => data.success && setUser(data.data.user))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/"
  }

  return { user, loading, logout }
}
```

---

## 5. 关键坑点（必看）

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Token 换取失败 | 格式错误 | 必须用 `x-www-form-urlencoded`，不是 JSON |
| 字段名不对 | SecondMe 特殊命名 | Token 响应用 `accessToken`，用户响应用 `name` |
| Cookie 不生效 | 设置时机错误 | 必须在 **响应对象** 上设置，不能只用 `cookies().set()` |
| fetch 没发 Cookie | 默认不携带 | 前端必须加 `credentials: "include"` |
| API 路由缓存 | Next.js 默认缓存 | 必须加 `export const dynamic = 'force-dynamic'` |
| 响应 code 判断 | 格式不同 | SecondMe 返回 `{ code: 0, data: {...} }`，成功时 code=0 |

---

## 6. 响应数据结构

### Token 响应
```json
{
  "code": 0,
  "data": {
    "accessToken": "xxx",
    "refreshToken": "xxx",
    "expiresIn": 604800
  }
}
```

### 用户信息响应
```json
{
  "code": 0,
  "data": {
    "id": "用户ID",
    "name": "用户名",
    "avatar": "头像URL"
  }
}
```

---

## 7. 快速检查清单

- [ ] 环境变量配置正确（CLIENT_ID 有 NEXT_PUBLIC_ 前缀）
- [ ] 数据库 User 表有 accessToken 字段
- [ ] 所有 API 路由加了 `export const dynamic = 'force-dynamic'`
- [ ] Token 请求用 `x-www-form-urlencoded` 格式
- [ ] Cookie 在响应对象上设置，不是直接调用 cookies().set()
- [ ] 前端 fetch 加了 `credentials: "include"`
- [ ] State 验证防止 CSRF

---

## 8. 调试技巧

```typescript
// 在 API 路由中添加日志
console.log("Token response:", { code: tokenData.code, hasData: !!tokenData.data })
console.log("Cookies:", request.cookies.getAll().map(c => c.name))
```

访问 `/api/auth/debug` 查看当前 Cookie 状态（如果有的话）。
