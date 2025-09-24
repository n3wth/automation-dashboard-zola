"use client"

import { useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Chats } from "@/lib/chat-store/types"
import { SidebarItem } from "./sidebar-item"
import { Pin } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChatGroup = {
  name: string
  chats: Chats[]
}

type VirtualizedChatListProps = {
  pinnedChats: Chats[]
  groupedChats: ChatGroup[] | null
  currentChatId?: string
  viewportRef: React.RefObject<HTMLElement | null>
}

type VirtualRow =
  | {
      type: "heading"
      key: string
      title: string
      icon?: ReactNode
      isFirst: boolean
    }
  | {
      type: "chat"
      key: string
      chat: Chats
    }

export function VirtualizedChatList({
  pinnedChats,
  groupedChats,
  currentChatId,
  viewportRef,
}: VirtualizedChatListProps) {
  const items = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = []
    let isFirstSection = true

    if (pinnedChats.length > 0) {
      rows.push({
        type: "heading",
        key: "pinned-heading",
        title: "Pinned",
        icon: <Pin className="size-3" />,
        isFirst: isFirstSection,
      })
      pinnedChats.forEach((chat) =>
        rows.push({ type: "chat", key: chat.id, chat })
      )
      isFirstSection = false
    }

    groupedChats?.forEach((group) => {
      rows.push({
        type: "heading",
        key: `group-${group.name}`,
        title: group.name,
        isFirst: isFirstSection,
      })
      group.chats.forEach((chat) =>
        rows.push({ type: "chat", key: chat.id, chat })
      )
      isFirstSection = false
    })

    return rows
  }, [groupedChats, pinnedChats])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewportRef.current ?? null,
    estimateSize: (index) => (items[index]?.type === "heading" ? 32 : 48),
    overscan: 8,
  })

  const measureElement = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        rowVirtualizer.measureElement(element)
      }
    },
    [rowVirtualizer]
  )

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className="relative"
      style={{ height: rowVirtualizer.getTotalSize(), minHeight: 0 }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index]
        if (!item) return null

        const baseStyle = {
          position: "absolute" as const,
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${virtualRow.start}px)`,
        }

        if (item.type === "heading") {
          return (
            <div
              key={item.key}
              ref={measureElement}
              style={baseStyle}
              className={cn(
                "px-2",
                item.isFirst ? "pt-3 pb-2" : "pt-5 pb-2"
              )}
            >
              <h3 className="flex items-center gap-1 overflow-hidden text-xs font-semibold break-all text-ellipsis">
                {item.icon ? <span>{item.icon}</span> : null}
                {item.title}
              </h3>
            </div>
          )
        }

        return (
          <div
            key={item.key}
            ref={measureElement}
            style={baseStyle}
            className="px-0"
          >
            <div className="mb-0.5">
              <SidebarItem chat={item.chat} currentChatId={currentChatId ?? ""} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
