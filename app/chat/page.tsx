"use client"

import { useEffect, useState, useRef } from "react"
import { Navigation } from "@/components/layout/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useToast } from "@/components/ui/toast"

interface Character {
  id: string
  name: string
  personality: string
  avatar: string | null
  createdBy: {
    id: string
    username: string
  }
}

interface Message {
  id: string
  message: string
  isFromAI: boolean
  createdAt: string
  character?: {
    name: string
    avatar: string | null
  }
}

function ChatContent() {
  const { showToast } = useToast()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 创建角色表单
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newCharacterPersonality, setNewCharacterPersonality] = useState("")

  useEffect(() => {
    fetchCharacters()
  }, [])

  useEffect(() => {
    if (selectedCharacter) {
      fetchMessages(selectedCharacter.id)
    }
  }, [selectedCharacter])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function fetchCharacters() {
    try {
      const response = await fetch("/api/chat/characters", { credentials: "include" })
      const result = await response.json()

      if (result.success) {
        setCharacters(result.data.characters)
        // 默认选择第一个角色
        if (result.data.characters.length > 0 && !selectedCharacter) {
          setSelectedCharacter(result.data.characters[0])
        }
      }
    } catch (error) {
      console.error("获取角色失败:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(characterId: string) {
    try {
      const response = await fetch(`/api/chat/${characterId}/messages`, { credentials: "include" })
      const result = await response.json()

      if (result.success) {
        setMessages(result.data.messages)
      }
    } catch (error) {
      console.error("获取消息失败:", error)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMessage.trim() || !selectedCharacter || sending) return

    setSending(true)
    const messageText = inputMessage.trim()
    setInputMessage("")

    // 乐观更新，先添加用户消息
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message: messageText,
      isFromAI: false,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch(`/api/chat/${selectedCharacter.id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      })

      const result = await response.json()

      if (result.success) {
        // 替换临时消息并添加AI回复
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== tempUserMessage.id)
            .concat([result.data.userMessage, result.data.aiMessage])
        )
      } else {
        showToast(result.error || "发送失败", "error")
        // 移除临时消息
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      }
    } catch (error) {
      showToast("网络错误", "error")
      // 移除临时消息
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setSending(false)
    }
  }

  async function handleCreateCharacter(e: React.FormEvent) {
    e.preventDefault()
    if (!newCharacterName.trim() || !newCharacterPersonality.trim()) {
      showToast("请填写完整信息", "error")
      return
    }

    try {
      const response = await fetch("/api/chat/characters", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCharacterName,
          personality: newCharacterPersonality,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showToast("创建成功", "success")
        setShowCreateModal(false)
        setNewCharacterName("")
        setNewCharacterPersonality("")
        fetchCharacters()
        setSelectedCharacter(result.data.character)
      } else {
        showToast(result.error || "创建失败", "error")
      }
    } catch (error) {
      showToast("网络错误", "error")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💬 AI 角色聊天
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
        >
          + 创建角色
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 角色列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            选择角色
          </h2>
          {characters.map((character) => (
            <button
              key={character.id}
              onClick={() => setSelectedCharacter(character)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selectedCharacter?.id === character.id
                  ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30"
                  : "border-gray-200 bg-white/80 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{character.avatar || "🤖"}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {character.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {character.personality}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 聊天区域 */}
        <div className="lg:col-span-2">
          {selectedCharacter ? (
            <div className="flex h-[600px] flex-col rounded-2xl border border-purple-200/50 bg-white/90 shadow-lg dark:border-purple-800/50 dark:bg-gray-800/90">
              {/* 聊天头部 */}
              <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-700">
                <span className="text-3xl">
                  {selectedCharacter.avatar || "🤖"}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCharacter.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCharacter.personality.slice(0, 50)}...
                  </p>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      开始和 {selectedCharacter.name} 聊天吧！
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.isFromAI ? "" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          message.isFromAI
                            ? "bg-purple-100 dark:bg-purple-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        <span className="text-sm">
                          {message.isFromAI
                            ? selectedCharacter.avatar || "🤖"
                            : "👤"}
                        </span>
                      </div>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.isFromAI
                            ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`mt-1 text-xs ${
                            message.isFromAI
                              ? "text-gray-400"
                              : "text-blue-200"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString(
                            "zh-CN",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入框 */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-100 p-4 dark:border-gray-700"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`和 ${selectedCharacter.name} 聊天...`}
                    disabled={sending}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {sending ? "..." : "发送"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-[600px] items-center justify-center rounded-2xl border border-purple-200/50 bg-white/80 dark:border-purple-800/50 dark:bg-gray-800/80">
              <p className="text-gray-500 dark:text-gray-400">
                请选择一个角色开始聊天
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 创建角色弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              创建新角色
            </h2>
            <form onSubmit={handleCreateCharacter} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  角色名称
                </label>
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  placeholder="例如：搞笑大师"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  性格描述
                </label>
                <textarea
                  value={newCharacterPersonality}
                  onChange={(e) => setNewCharacterPersonality(e.target.value)}
                  placeholder="描述这个角色的性格特点..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-pink-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <AuthGuard
            title="登录后开始 AI 聊天"
            description="与各种 AI 角色互动，讨论梗文化，创建属于你自己的 AI 角色！"
            icon="🤖"
          >
            <ChatContent />
          </AuthGuard>
        </div>
      </div>
    </main>
  )
}
