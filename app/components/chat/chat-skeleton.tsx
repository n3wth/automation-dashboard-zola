"use client"

import { ChatContainerContent, ChatContainerRoot } from "@/components/prompt-kit/chat-container"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function MessageSkeleton({ variant = "assistant" }: { variant?: "user" | "assistant" }) {
  const justify = variant === "user" ? "justify-end" : "justify-start"
  const bubbleAlignment = variant === "user" ? "items-end" : "items-start"
  const bubbleBackground =
    variant === "user" ? "bg-transparent" : "bg-transparent"

  return (
    <div className={cn("flex w-full px-6", justify)}>
      <div className="w-full max-w-3xl mx-auto">
        <div
          className={cn(
            "flex w-full flex-col gap-3 rounded-3xl p-4 opacity-30",
            bubbleAlignment,
            bubbleBackground
          )}
        >
          <Skeleton className="h-3.5 w-32 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-2/3 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function ResponseCardSkeleton() {
  return (
    <div className="bg-transparent w-full max-w-[420px] flex-shrink-0 rounded-2xl p-4 opacity-30">
      <Skeleton className="mb-4 h-3 w-20 rounded-full bg-white/10" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-5/6 bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
      </div>
    </div>
  )
}

export function ConversationSkeleton({ responseCount = 0 }: { responseCount?: number }) {
  const showResponses = responseCount > 0
  const responsesToRender = showResponses ? Array.from({ length: responseCount }) : []

  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 mx-auto flex w-full flex-col justify-center">
        <div className="flex h-[56px] w-full bg-background" />
        <div className="flex h-4 w-full bg-gradient-to-b from-background to-transparent" />
      </div>
      <ChatContainerRoot className="relative h-full w-full overflow-y-auto overflow-x-hidden">
        <ChatContainerContent
          className="flex w-full flex-col items-center gap-6 pt-32 pb-4"
          style={{
            scrollbarGutter: "stable both-edges",
            scrollbarWidth: "none",
          }}
        >
          <MessageSkeleton variant="user" />
          {showResponses ? (
            <div className="w-full px-6">
              <div
                className={cn(
                  "mx-auto flex w-full gap-4",
                  responseCount > 1 ? "max-w-[1800px]" : "max-w-3xl",
                  "overflow-hidden"
                )}
              >
                {responsesToRender.map((_, index) => (
                  <ResponseCardSkeleton key={`response-skeleton-${index}`} />
                ))}
                <div className="w-px flex-shrink-0" />
              </div>
            </div>
          ) : (
            <>
              <MessageSkeleton variant="assistant" />
              <MessageSkeleton variant="assistant" />
            </>
          )}
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  )
}

export function ChatInputSkeleton({
  className,
  withModelSelector = false,
}: {
  className?: string
  withModelSelector?: boolean
}) {
  return (
    <div
      className={cn(
        "bg-transparent relative z-10 rounded-3xl p-4 opacity-30",
        className
      )}
    >
      <Skeleton className="h-16 w-full rounded-2xl bg-white/10" />
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {withModelSelector ? (
            <>
              <Skeleton className="h-5 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-5 w-16 rounded-md bg-white/10" />
            </>
          ) : (
            <Skeleton className="h-5 w-28 rounded-md bg-white/10" />
          )}
        </div>
        <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

export function ChatPageSkeleton({ variant = "single" }: { variant?: "single" | "multi" }) {
  return (
    <div className="@container/main relative flex h-full flex-col items-center justify-end md:justify-center">
      <ConversationSkeleton responseCount={variant === "multi" ? 2 : 0} />
      <div className="relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl">
        <ChatInputSkeleton withModelSelector={variant === "multi"} />
      </div>
    </div>
  )
}
