"use client"

import { useKeyShortcut } from "@/app/hooks/use-key-shortcut"
import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useModel } from "@/app/components/chat/use-model"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"
import { redirect, useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useChatCore } from "./use-chat-core"
import { useChatOperations } from "./use-chat-operations"
import { useFileUpload } from "./use-file-upload"

const isEditableElement = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false

  const tagName = element.tagName
  if (!tagName) return false

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    element.isContentEditable ||
    element.getAttribute("role") === "textbox"
  )
}

const isMacOs = () => {
  if (typeof navigator === "undefined") return false
  const platform = navigator.userAgent || ""
  return /Mac|iPhone|iPad|iPod/i.test(platform)
}

const FeedbackWidget = dynamic(
  () => import("./feedback-widget").then((mod) => mod.FeedbackWidget),
  { ssr: false }
)

const DialogAuth = dynamic(
  () => import("./dialog-auth").then((mod) => mod.DialogAuth),
  { ssr: false }
)

export function Chat() {
  const router = useRouter()
  const { chatId } = useChatSession()
  const {
    chats,
    createNewChat,
    getChatById,
    updateChatModel,
    bumpChat,
    isLoading: isChatsLoading,
    fetchingDirectChat,
    attemptedDirectFetch,
  } = useChats()

  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  )

  const {
    messages: initialMessages,
    cacheAndAddMessage,
    deleteMessages: deleteMessagesFromStore,
  } = useMessages()
  const { user } = useUser()
  const { preferences } = useUserPreferences()
  const { draftValue, clearDraft } = useChatDraft(chatId)

  // File upload functionality
  const {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  } = useFileUpload()

  // Model selection
  const { selectedModel, handleModelChange } = useModel({
    currentChat: currentChat || null,
    user,
    updateChatModel,
    chatId,
  })

  // State to pass between hooks
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  // New state for quoted text
  const [quotedText, setQuotedText] = useState<{
    text: string
    messageId: string
  }>()
  const handleQuotedSelected = useCallback(
    (text: string, messageId: string) => {
      setQuotedText({ text, messageId })
    },
    []
  )

  // Chat operations (utils + handlers) - created first
  const { checkLimitsAndNotify, ensureChatExists, handleDelete, handleEdit } =
    useChatOperations({
      isAuthenticated,
      chatId,
      messages: initialMessages,
      selectedModel,
      systemPrompt,
      createNewChat,
      setHasDialogAuth,
      setMessages: () => {},
      setInput: () => {},
    })

  // Core chat functionality (initialization + state + actions)
  const {
    messages,
    input,
    status,
    stop,
    setMessages,
    hasSentFirstMessageRef,
    isSubmitting,
    enableSearch,
    setEnableSearch,
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
  } = useChatCore({
    initialMessages,
    draftValue,
    cacheAndAddMessage,
    chatId,
    user,
    files,
    createOptimisticAttachments,
    setFiles,
    checkLimitsAndNotify,
      cleanupOptimisticAttachments,
      ensureChatExists,
      handleFileUploads,
      selectedModel,
      clearDraft,
    bumpChat,
  })

  // Memoize the conversation props to prevent unnecessary rerenders
  const conversationProps = useMemo(
    () => ({
      messages,
      status,
      onDelete: handleDelete,
      onEdit: handleEdit,
      onReload: handleReload,
      onQuote: handleQuotedSelected,
    }),
    [
      messages,
      status,
      handleDelete,
      handleEdit,
      handleReload,
      handleQuotedSelected,
    ]
  )

  // Memoize the chat input props
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onSuggestion: handleSuggestion,
      onValueChange: handleInputChange,
      onSend: submit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      hasSuggestions:
        preferences.promptSuggestions && !chatId && messages.length === 0,
      onSelectModel: handleModelChange,
      selectedModel,
      isUserAuthenticated: isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
      quotedText,
    }),
    [
      input,
      handleSuggestion,
      handleInputChange,
      submit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      preferences.promptSuggestions,
      chatId,
      messages.length,
      handleModelChange,
      selectedModel,
      isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
      quotedText,
    ]
  )

  const chatOrder = chats
    .map((chat) => chat.id)
    .filter((id): id is string => Boolean(id))

  const navigateChat = useCallback(
    (offset: number) => {
      if (!chatId || chatOrder.length <= 1) {
        return
      }

      const currentIndex = chatOrder.findIndex((id) => id === chatId)
      if (currentIndex === -1) {
        return
      }

      const nextIndex = (currentIndex + offset + chatOrder.length) % chatOrder.length
      const nextChatId = chatOrder[nextIndex]

      if (nextChatId && nextChatId !== chatId) {
        router.push(`/c/${nextChatId}`)
      }
    },
    [chatId, chatOrder, router]
  )

  useKeyShortcut(
    useCallback((event: KeyboardEvent) => {
      if (event.repeat) return false
      if (isEditableElement(event.target)) return false

      if (isMacOs()) {
        return event.metaKey && event.altKey && !event.shiftKey && event.key === "ArrowUp"
      }

      return event.ctrlKey && event.shiftKey && event.key === "ArrowUp"
    }, []),
    useCallback(() => {
      navigateChat(-1)
    }, [navigateChat])
  )

  useKeyShortcut(
    useCallback((event: KeyboardEvent) => {
      if (event.repeat) return false
      if (isEditableElement(event.target)) return false

      if (isMacOs()) {
        return event.metaKey && event.altKey && !event.shiftKey && event.key === "ArrowDown"
      }

      return event.ctrlKey && event.shiftKey && event.key === "ArrowDown"
    }, []),
    useCallback(() => {
      navigateChat(1)
    }, [navigateChat])
  )

  const handleClearChat = useCallback(async () => {
    if (!chatId || messages.length === 0) {
      return
    }

    const shouldClear =
      typeof window === "undefined" ||
      window.confirm("Clear all messages in this chat? This action cannot be undone.")

    if (!shouldClear) {
      return
    }

    if (status === "streaming" || status === "submitted") {
      stop()
    }

    setMessages([])
    handleInputChange("")

    try {
      await deleteMessagesFromStore()
      toast({
        title: "Chat cleared",
        description: "All messages were removed from this conversation.",
        status: "success",
      })
    } catch (error) {
      console.error("Failed to clear chat:", error)
      toast({ title: "Failed to clear chat", status: "error" })
    }
  }, [
    chatId,
    deleteMessagesFromStore,
    handleInputChange,
    messages.length,
    setMessages,
    status,
    stop,
  ])

  useKeyShortcut(
    useCallback((event: KeyboardEvent) => {
      if (event.repeat) return false
      if (!event.shiftKey) return false
      if (!(event.metaKey || event.ctrlKey)) return false

      return event.key.toLowerCase() === "x"
    }, []),
    useCallback(() => {
      void handleClearChat()
    }, [handleClearChat])
  )

  const handleStopShortcut = useCallback(() => {
    if (status === "streaming" || status === "submitted") {
      stop()
    }
  }, [status, stop])

  useKeyShortcut(
    useCallback(
      (event: KeyboardEvent) =>
        !event.repeat && (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key === ".",
      []
    ),
    handleStopShortcut
  )

  // Handle redirect for invalid chatId - only redirect if we're certain the chat doesn't exist
  // and we're not in a transient state during chat creation or fetching automation chats
  const shouldRedirect = (
    chatId &&
    !isChatsLoading &&
    !currentChat &&
    !isSubmitting &&
    status === "ready" &&
    messages.length === 0 &&
    !hasSentFirstMessageRef.current // Don't redirect if we've already sent a message in this session
  )

  // Check if we're currently fetching or should wait for fetch attempt
  const isFetchingOrWillFetch = fetchingDirectChat === chatId ||
    (shouldRedirect && !attemptedDirectFetch.has(chatId))

  // Log the state for debugging - commented out to prevent performance issues
  // if (chatId) {
  //   console.log(`[Chat] State for ${chatId}:`, {
  //     shouldRedirect,
  //     isFetchingOrWillFetch,
  //     currentChat: !!currentChat,
  //     fetchingDirectChat,
  //     attempted: attemptedDirectFetch.has(chatId),
  //     isChatsLoading,
  //     isSubmitting,
  //     status,
  //     messagesLength: messages.length
  //   })
  // }

  // If we should redirect but haven't tried fetching the chat directly yet, show loading
  if (shouldRedirect && isFetchingOrWillFetch) {
    // The effect will trigger fetchChatDirectly, so we just show loading
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading automation chat...</p>
        </div>
      </div>
    )
  }

  // If we've finished trying to fetch and still no chat, then redirect
  // Check attemptedDirectFetch to see if we've tried
  if (shouldRedirect && !isFetchingOrWillFetch && attemptedDirectFetch.has(chatId)) {
    console.log(`[Chat] Redirecting because chat ${chatId} not found after fetch attempt`)
    redirect("/")
  }

  const showLoadingForDirectFetch = chatId && fetchingDirectChat === chatId && !currentChat
  const hasMessages = messages.length > 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <DialogAuth open={hasDialogAuth} setOpen={setHasDialogAuth} />

      <AnimatePresence initial={false} mode="wait">
        {showLoadingForDirectFetch ? (
          <motion.div
            key="direct-fetch-loading"
            className="absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-xl font-medium tracking-tight mb-2">
                Loading automation chat...
              </h2>
              <p className="text-muted-foreground text-sm">
                Fetching chat: {chatId}
              </p>
            </div>
          </motion.div>
        ) : hasMessages ? (
          <Conversation key="conversation" {...conversationProps} />
        ) : (
          <motion.div
            key="onboarding"
            className="mx-auto max-w-[50rem] mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What&apos;s on your mind?
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
        )}
      >
        <ChatInput {...chatInputProps} />
      </div>

      <FeedbackWidget authUserId={user?.id} />
    </div>
  )
}
