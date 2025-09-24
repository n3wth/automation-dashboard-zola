import { toast } from "@/components/ui/toast"
import { checkRateLimits } from "@/lib/api"
import type { Chats } from "@/lib/chat-store/types"
import { REMAINING_QUERY_ALERT_THRESHOLD } from "@/lib/config"
import { Message } from "@ai-sdk/react"
import { useCallback } from "react"

type UseChatOperationsProps = {
  isAuthenticated: boolean
  chatId: string | null
  messages: Message[]
  selectedModel: string
  systemPrompt: string
  createNewChat: (
    userId: string,
    title?: string,
    model?: string,
    isAuthenticated?: boolean,
    systemPrompt?: string
  ) => Promise<Chats | undefined>
  setHasDialogAuth: (value: boolean) => void
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void
  setInput: (input: string) => void
}

export function useChatOperations({
  isAuthenticated,
  chatId,
  messages,
  selectedModel,
  systemPrompt,
  createNewChat,
  setHasDialogAuth,
  setMessages,
}: UseChatOperationsProps) {
  // Chat utilities
  const checkLimitsAndNotify = async (uid: string): Promise<boolean> => {
    try {
      const rateData = await checkRateLimits(uid, isAuthenticated)

      // Handle API error response (rate limit exceeded)
      if (rateData.error) {
        if (!isAuthenticated) {
          setHasDialogAuth(true)
          return false
        }

        toast({
          title: "Rate limit exceeded",
          description: rateData.message || "Please try again later or upgrade your account.",
          status: "error",
        })
        return false
      }

      if (rateData.remaining === 0 && !isAuthenticated) {
        setHasDialogAuth(true)
        return false
      }

      if (rateData.remaining === REMAINING_QUERY_ALERT_THRESHOLD) {
        toast({
          title: `Only ${rateData.remaining} quer${
            rateData.remaining === 1 ? "y" : "ies"
          } remaining today.`,
          status: "info",
        })
      }

      if (rateData.remainingPro === REMAINING_QUERY_ALERT_THRESHOLD) {
        toast({
          title: `Only ${rateData.remainingPro} pro quer${
            rateData.remainingPro === 1 ? "y" : "ies"
          } remaining today.`,
          status: "info",
        })
      }

      return true
    } catch (err) {
      console.error("Rate limit check failed:", err)

      // If not authenticated and rate limit check fails, show auth dialog
      if (!isAuthenticated) {
        setHasDialogAuth(true)
        return false
      }

      // For authenticated users, show error toast
      toast({
        title: "Unable to check rate limits",
        description: "Please try again or contact support if the issue persists.",
        status: "error",
      })

      return false
    }
  }

  const ensureChatExists = async (userId: string, input: string) => {
    if (!isAuthenticated) {
      const storedGuestChatId = localStorage.getItem("guestChatId")
      if (storedGuestChatId) return storedGuestChatId
    }

    if (messages.length === 0) {
      try {
        const newChat = await createNewChat(
          userId,
          input,
          selectedModel,
          isAuthenticated,
          systemPrompt
        )

        if (!newChat) return null
        if (isAuthenticated) {
          window.history.pushState(null, "", `/c/${newChat.id}`)
        } else {
          localStorage.setItem("guestChatId", newChat.id)
        }

        return newChat.id
      } catch (err: unknown) {
        console.error("Chat creation error:", err)
        let errorMessage = "Failed to create chat"
        try {
          const errorObj = err as { message?: string }
          if (errorObj.message) {
            const parsed = JSON.parse(errorObj.message)
            errorMessage = parsed.error || errorMessage
          }
        } catch {
          const errorObj = err as { message?: string }
          errorMessage = errorObj.message || errorMessage
        }

        // Don't show the same error twice if it's already been handled
        if (!errorMessage.includes("Supabase not available") &&
            !errorMessage.includes("Rate limit") &&
            !errorMessage.includes("DAILY_LIMIT_REACHED")) {
          toast({
            title: errorMessage,
            status: "error",
          })
        }
        return null
      }
    }

    return chatId
  }

  // Message handlers
  const handleDelete = useCallback(
    (id: string) => {
      setMessages(messages.filter((message) => message.id !== id))
    },
    [messages, setMessages]
  )

  const handleEdit = useCallback(
    (id: string, newText: string) => {
      setMessages(
        messages.map((message) =>
          message.id === id ? { ...message, content: newText } : message
        )
      )
    },
    [messages, setMessages]
  )

  return {
    // Utils
    checkLimitsAndNotify,
    ensureChatExists,

    // Handlers
    handleDelete,
    handleEdit,
  }
}
