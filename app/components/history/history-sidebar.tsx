"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useChats } from "@/lib/chat-store/chats/provider"
import type { Chats } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
import {
  Check,
  MagnifyingGlass,
  PencilSimple,
  TrashSimple,
  X,
} from "@phosphor-icons/react"
import { Pin, PinOff } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { formatDate, groupChatsByDate } from "./utils"

type HistorySidebarProps = {
  chatHistory: Chats[]
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
}

export function HistorySidebar({
  chatHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
  onOpenChange,
}: HistorySidebarProps) {
  const params = useParams<{ chatId: string }>()
  const { pinnedChats, togglePinned } = useChats()

  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)

      if (!open) {
        setSearchQuery("")
        setEditingId(null)
        setEditTitle("")
        setDeletingId(null)
      }
    },
    [setIsOpen, onOpenChange]
  )

  const handleEdit = useCallback((chat: Chats) => {
    setEditingId(chat.id)
    setEditTitle(chat.title || "")
  }, [])

  const handleSaveEdit = useCallback(
    async (id: string) => {
      setEditingId(null)
      await onSaveEdit(id, editTitle)
    },
    [editTitle, onSaveEdit]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle("")
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(null)
      await onConfirmDelete(id)
    },
    [onConfirmDelete]
  )

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null)
  }, [])

  const filteredChat = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return query
      ? chatHistory.filter((chat) =>
          (chat.title || "").toLowerCase().includes(query)
        )
      : chatHistory
  }, [chatHistory, searchQuery])

  const groupedChats = useMemo(
    () => groupChatsByDate(chatHistory, searchQuery),
    [chatHistory, searchQuery]
  )

  const renderChatItem = useCallback(
    (chat: Chats) => {
      const isActive = params?.chatId === chat.id

      if (editingId === chat.id) {
        return (
          <div
            key={chat.id}
            className="bg-accent flex items-center justify-between rounded-lg px-2 py-2.5"
          >
            <form
              className="flex w-full items-center justify-between"
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveEdit(chat.id)
              }}
            >
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-8 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSaveEdit(chat.id)
                  }
                }}
              />
              <div className="ml-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground size-8"
                  type="submit"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground size-8"
                  type="button"
                  onClick={handleCancelEdit}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        )
      }

      if (deletingId === chat.id) {
        return (
          <div
            key={chat.id}
            className="bg-accent flex items-center justify-between rounded-lg px-2 py-2.5"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleConfirmDelete(chat.id)
              }}
              className="flex w-full items-center justify-between"
            >
              <div className="flex flex-1 items-center">
                <span className="text-base font-normal">{chat.title}</span>
                <input
                  type="text"
                  className="sr-only"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault()
                      handleCancelDelete()
                    } else if (e.key === "Enter") {
                      e.preventDefault()
                      handleConfirmDelete(chat.id)
                    }
                  }}
                />
              </div>
              <div className="ml-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive size-8"
                  type="submit"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive size-8"
                  onClick={handleCancelDelete}
                  type="button"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        )
      }

      return (
        <div
          key={chat.id}
          className={cn(
            "group flex items-center justify-between rounded-lg px-2 py-2 transition-colors",
            isActive && "bg-accent text-foreground"
          )}
        >
          <Link
            href={`/c/${chat.id}`}
            className="flex flex-1 flex-col items-start"
            prefetch
            onClick={() => handleOpenChange(false)}
          >
            <span className="line-clamp-1 text-base font-normal">
              {chat.title || "Untitled Chat"}
            </span>
            <span className="text-muted-foreground mt-0.5 text-xs">
              {formatDate(chat?.updated_at || chat?.created_at)}
            </span>
          </Link>
          <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground size-8"
              onClick={(e) => {
                e.preventDefault()
                togglePinned(chat.id, !chat.pinned)
              }}
              type="button"
              aria-label={chat.pinned ? "Unpin" : "Pin"}
            >
              {chat.pinned ? (
                <PinOff className="size-4 stroke-[1.5px]" />
              ) : (
                <Pin className="size-4 stroke-[1.5px]" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground size-8"
              onClick={(e) => {
                e.preventDefault()
                handleEdit(chat)
              }}
              type="button"
            >
              <PencilSimple className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={(e) => {
                e.preventDefault()
                handleDelete(chat.id)
              }}
              type="button"
            >
              <TrashSimple className="size-4" />
            </Button>
          </div>
        </div>
      )
    },
    [
      params?.chatId,
      editingId,
      deletingId,
      editTitle,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
      togglePinned,
      handleOpenChange,
    ]
  )

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>History</TooltipContent>
      </Tooltip>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="left" className="sm:max-w-md w-full border-r p-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>Chat history</SheetTitle>
            <SheetDescription>
              Search and manage your past conversations
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
              <div className="relative">
                <Input
                  placeholder="Search..."
                  className="rounded-lg py-1.5 pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              </div>
            </div>
            <ScrollArea className="flex-1 overflow-auto">
              <div className="flex flex-col space-y-6 px-4 pt-4 pb-8">
                {filteredChat.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    No chat history found.
                  </div>
                ) : searchQuery ? (
                  <div className="space-y-2">
                    {filteredChat.map((chat) => renderChatItem(chat))}
                  </div>
                ) : (
                  <>
                    {pinnedChats.length > 0 && (
                      <div className="space-y-1.5">
                        <h3 className="text-muted-foreground flex items-center gap-1 pl-2 text-sm font-medium">
                          <Pin className="size-3" />
                          Pinned
                        </h3>
                        <div className="space-y-2">
                          {pinnedChats.map((chat) => renderChatItem(chat))}
                        </div>
                      </div>
                    )}
                    {groupedChats?.map((group) => (
                      <div key={group.name} className="space-y-1.5">
                        <h3 className="text-muted-foreground pl-2 text-sm font-medium">
                          {group.name}
                        </h3>
                        <div className="space-y-2">
                          {group.chats.map((chat) => renderChatItem(chat))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
