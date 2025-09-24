import { ChatContainer } from "@/app/components/chat/chat-container"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { Suspense } from "react"
import { ChatPageSkeleton } from "@/app/components/chat/chat-skeleton"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <MessagesProvider>
      <LayoutApp>
        <Suspense fallback={<ChatPageSkeleton />}>
          <ChatContainer />
        </Suspense>
      </LayoutApp>
    </MessagesProvider>
  )
}