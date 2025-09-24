"use client"

import { toast } from "@/components/ui/toast"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { MODEL_DEFAULT, SYSTEM_PROMPT_DEFAULT } from "../../config"
import type { Chats } from "../types"
import {
  createNewChat as createNewChatFromDb,
  deleteChat as deleteChatFromDb,
  fetchAndCacheChats,
  getCachedChats,
  updateChatModel as updateChatModelFromDb,
  updateChatTitle,
} from "./api"

interface ChatsContextType {
  chats: Chats[]
  refresh: () => Promise<void>
  isLoading: boolean
  updateTitle: (id: string, title: string) => Promise<void>
  deleteChat: (
    id: string,
    currentChatId?: string,
    redirect?: () => void
  ) => Promise<void>
  setChats: React.Dispatch<React.SetStateAction<Chats[]>>
  createNewChat: (
    userId: string,
    title?: string,
    model?: string,
    isAuthenticated?: boolean,
    systemPrompt?: string,
    projectId?: string
  ) => Promise<Chats | undefined>
  resetChats: () => Promise<void>
  getChatById: (id: string) => Chats | undefined
  updateChatModel: (id: string, model: string) => Promise<void>
  bumpChat: (id: string) => Promise<void>
  togglePinned: (id: string, pinned: boolean) => Promise<void>
  pinnedChats: Chats[]
  fetchingDirectChat: string | null
  attemptedDirectFetch: Set<string>
}
const ChatsContext = createContext<ChatsContextType | null>(null)

export function useChats() {
  const context = useContext(ChatsContext)
  if (!context) throw new Error("useChats must be used within ChatsProvider")
  return context
}

export function ChatsProvider({
  userId,
  children,
}: {
  userId?: string
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [chats, setChats] = useState<Chats[]>([])
  const [fetchingDirectChat, setFetchingDirectChat] = useState<string | null>(null)
  const [attemptedDirectFetch, setAttemptedDirectFetch] = useState<Set<string>>(new Set())

  useEffect(() => {
    // HACK: In development, allow initialization without userId for automation chats
    const isDev = process.env.NODE_ENV === 'development'
    if (!userId && !isDev) return

    const load = async () => {
      setIsLoading(true)

      // Only try to load cached/fresh chats if we have a userId
      if (userId) {
        const cached = await getCachedChats()
        setChats(cached)

        try {
          const fresh = await fetchAndCacheChats(userId)
          setChats(fresh)
        } catch (error) {
          console.error("Failed to fetch chats:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        // In dev mode without userId, just set loading to false
        setIsLoading(false)
      }
    }

    load()
  }, [userId])

  const refresh = async () => {
    if (!userId) return

    try {
      const fresh = await fetchAndCacheChats(userId)
      setChats(fresh)
    } catch (error) {
      console.error("Failed to refresh chats:", error)
    }
  }

  const updateTitle = async (id: string, title: string) => {
    const prev = [...chats]
    const updatedChatWithNewTitle = prev.map((c) =>
      c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
    )
    const sorted = updatedChatWithNewTitle.sort(
      (a, b) => +new Date(b.updated_at || "") - +new Date(a.updated_at || "")
    )
    setChats(sorted)
    try {
      await updateChatTitle(id, title)
    } catch {
      setChats(prev)
      toast({ title: "Failed to update title", status: "error" })
    }
  }

  const deleteChat = async (
    id: string,
    currentChatId?: string,
    redirect?: () => void
  ) => {
    const prev = [...chats]
    setChats((prev) => prev.filter((c) => c.id !== id))

    try {
      await deleteChatFromDb(id)
      if (id === currentChatId && redirect) redirect()
    } catch {
      setChats(prev)
      toast({ title: "Failed to delete chat", status: "error" })
    }
  }

  const createNewChat = async (
    userId: string,
    title?: string,
    model?: string,
    isAuthenticated?: boolean,
    systemPrompt?: string,
    projectId?: string
  ) => {
    if (!userId) return
    const prev = [...chats]

    const optimisticId = `optimistic-${Date.now().toString()}`
    const optimisticChat = {
      id: optimisticId,
      title: title || "New Chat",
      created_at: new Date().toISOString(),
      model: model || MODEL_DEFAULT,
      system_prompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      user_id: userId,
      public: true,
      updated_at: new Date().toISOString(),
      project_id: null,
      pinned: false,
      pinned_at: null,
    }
    setChats((prev) => [optimisticChat, ...prev])

    try {
      const newChat = await createNewChatFromDb(
        userId,
        title,
        model,
        isAuthenticated,
        projectId
      )

      setChats((prev) => [
        newChat,
        ...prev.filter((c) => c.id !== optimisticId),
      ])

      return newChat
    } catch {
      setChats(prev)
      toast({ title: "Failed to create chat", status: "error" })
    }
  }

  const resetChats = async () => {
    setChats([])
  }

  const getChatById = useCallback((id: string) => {
    const chat = chats.find((c) => c.id === id)
    return chat
  }, [chats])

  // HACK: Fetch any chat by ID, bypassing user check
  const fetchChatDirectly = useCallback(async (chatId: string) => {
    if (fetchingDirectChat === chatId || attemptedDirectFetch.has(chatId)) {
      return // Prevent duplicate requests
    }

    setFetchingDirectChat(chatId)
    try {
      if (process.env.NODE_ENV === 'development') {
        const devUserId = '00000000-0000-0000-0000-000000000001'
        const response = await fetch(`/api/chats?userId=${devUserId}&isAuthenticated=false`)
        if (response.ok) {
          const payload = (await response.json()) as { chats?: Chats[] }
          const remoteChats = payload.chats ?? []
          const chat = remoteChats.find((c) => c.id === chatId)
          if (chat) {
            setChats((prev) => {
              if (prev.find((c) => c.id === chatId)) return prev
              return [chat, ...prev]
            })
            console.log(`Successfully fetched automation chat: ${chatId}`)
          } else {
            console.warn(`Chat not found: ${chatId}`)
          }
        } else {
          console.error("Failed to fetch chat via API:", response.status)
        }
      } else {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        if (!supabase) {
          setAttemptedDirectFetch((prev) => new Set(prev).add(chatId))
          return
        }

        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("id", chatId)
          .single()

        if (data && !error) {
          setChats((prev) => {
            if (prev.find((c) => c.id === chatId)) return prev
            return [data, ...prev]
          })
          console.log(`Successfully fetched automation chat: ${chatId}`)
        } else {
          console.warn(`Chat not found: ${chatId}`, error)
        }
      }

      setAttemptedDirectFetch((prev) => new Set(prev).add(chatId))
    } catch (err) {
      console.error("Failed to fetch chat directly:", err)
      setAttemptedDirectFetch((prev) => new Set(prev).add(chatId))
    } finally {
      setFetchingDirectChat(null)
    }
  }, [attemptedDirectFetch, fetchingDirectChat])

  // HACK: Use effect to trigger fetches to avoid setState during render
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'

    if (typeof window === 'undefined') return

    const pathSegments = window.location.pathname.split('/')
    if (pathSegments[1] !== 'c' || !pathSegments[2]) return

    const chatId = pathSegments[2]
    const chatExists = chats.find((c) => c.id === chatId)

    if (!chatExists && chatId && fetchingDirectChat !== chatId && !attemptedDirectFetch.has(chatId)) {
      if (isDev || userId) {
        fetchChatDirectly(chatId)
      }
    }
  }, [attemptedDirectFetch, chats, fetchChatDirectly, fetchingDirectChat, userId])

  const updateChatModel = async (id: string, model: string) => {
    const prev = [...chats]
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, model } : c)))
    try {
      await updateChatModelFromDb(id, model)
    } catch {
      setChats(prev)
      toast({ title: "Failed to update model", status: "error" })
    }
  }

  const bumpChat = async (id: string) => {
    const prev = [...chats]
    const updatedChatWithNewUpdatedAt = prev.map((c) =>
      c.id === id ? { ...c, updated_at: new Date().toISOString() } : c
    )
    const sorted = updatedChatWithNewUpdatedAt.sort(
      (a, b) => +new Date(b.updated_at || "") - +new Date(a.updated_at || "")
    )
    setChats(sorted)
  }

  const togglePinned = async (id: string, pinned: boolean) => {
    const prevChats = [...chats]
    const now = new Date().toISOString()

    const updatedChats = prevChats.map((chat) =>
      chat.id === id
        ? { ...chat, pinned, pinned_at: pinned ? now : null }
        : chat
    )
    // Sort to maintain proper order of chats
    const sortedChats = updatedChats.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
      return bTime - aTime
    })
    setChats(sortedChats)
    try {
      const { toggleChatPin } = await import("./api")
      await toggleChatPin(id, pinned)
    } catch {
      setChats(prevChats)
      toast({
        title: "Failed to update pin",
        status: "error",
      })
    }
  }

  const pinnedChats = useMemo(
    () =>
      chats
        .filter((c) => c.pinned && !c.project_id)
        .slice()
        .sort((a, b) => {
          const at = a.pinned_at ? +new Date(a.pinned_at) : 0
          const bt = b.pinned_at ? +new Date(b.pinned_at) : 0
          return bt - at
        }),
    [chats]
  )

  return (
    <ChatsContext.Provider
      value={{
        chats,
        refresh,
        updateTitle,
        deleteChat,
        setChats,
        createNewChat,
        resetChats,
        getChatById,
        updateChatModel,
        bumpChat,
        isLoading,
        togglePinned,
        pinnedChats,
        fetchingDirectChat,
        attemptedDirectFetch,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}
