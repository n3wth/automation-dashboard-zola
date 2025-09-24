import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { Loader } from "@/components/prompt-kit/loader"
import { ScrollButton } from "@/components/prompt-kit/scroll-button"
import { Message as MessageType } from "@ai-sdk/react"
import { useRef } from "react"
import { Message } from "./message"

type ConversationProps = {
  messages: MessageType[]
  status?: "streaming" | "ready" | "submitted" | "error"
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
  onReload: () => void
  onQuote?: (text: string, messageId: string) => void
}

export function Conversation({
  messages,
  status = "ready",
  onDelete,
  onEdit,
  onReload,
  onQuote,
}: ConversationProps) {
  const initialMessageCount = useRef(messages.length)

  if (!messages || messages.length === 0)
    return null

  return (
    <section
      className="relative flex h-full w-full flex-col items-center overflow-hidden"
      aria-label="Conversation history"
    >
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 mx-auto flex w-full flex-col justify-center">
        <div className="h-[56px] bg-background flex w-full" />
        <div className="h-4 bg-gradient-to-b from-background to-transparent flex w-full" />
      </div>
      <ChatContainerRoot
        className="relative h-full w-full overflow-y-auto overflow-x-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        tabIndex={0}
        aria-label="Conversation messages"
        aria-busy={status === "streaming"}
      >
        <ChatContainerContent
          className="flex w-full flex-col items-center pt-32 pb-4"
          style={{
            scrollbarGutter: "stable both-edges",
            scrollbarWidth: "none",
          }}
        >
          <ol className="mx-auto flex w-full list-none flex-col items-center gap-0 pb-4 pl-0 pr-0">
            {messages?.map((message, index) => {
              const isLast =
                index === messages.length - 1 && status !== "submitted"
              const hasScrollAnchor =
                isLast && messages.length > initialMessageCount.current

              return (
                <li key={message.id} className="w-full list-none">
                  <Message
                    id={message.id}
                    variant={message.role}
                    attachments={message.experimental_attachments}
                    isLast={isLast}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReload={onReload}
                    hasScrollAnchor={hasScrollAnchor}
                    parts={message.parts}
                    status={status}
                    onQuote={onQuote}
                  >
                    {message.content}
                  </Message>
                </li>
              )
            })}
            {status === "submitted" &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <li
                  className="group min-h-scroll-anchor flex w-full max-w-3xl list-none flex-col items-start gap-2 px-6 pb-2"
                  role="status"
                  aria-live="polite"
                >
                  <span className="sr-only">Assistant is responding</span>
                  <Loader />
                </li>
              )}
          </ol>
          <div className="pointer-events-none absolute bottom-0 flex w-full max-w-3xl flex-1 items-end justify-end gap-4 px-6 pb-2">
            <ScrollButton
              className="pointer-events-auto absolute right-[30px] top-[-50px]"
              aria-label="Scroll to latest messages"
            />
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </section>
  )
}
