"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatsProvider } from "@/lib/chat-store/chats/provider"
import { ChatSessionProvider } from "@/lib/chat-store/session/provider"
import { ModelProvider } from "@/lib/model-store/provider"
import { TanstackQueryProvider } from "@/lib/tanstack-query/tanstack-query-provider"
import { UserPreferencesProvider } from "@/lib/user-preference-store/provider"
import { UserProvider } from "@/lib/user-store/provider"
import type { UserProfile } from "@/lib/user/types"
import { ThemeProvider } from "next-themes"
import { CSPostHogProvider } from "@/app/providers/posthog-provider"

interface AppProviderProps {
  children: React.ReactNode
  userProfile: UserProfile | null
}

export function AppProvider({ children, userProfile }: AppProviderProps) {
  return (
    <TanstackQueryProvider>
      <UserProvider initialUser={userProfile}>
        <ModelProvider>
          <ChatsProvider userId={userProfile?.id}>
            <ChatSessionProvider>
              <UserPreferencesProvider
                userId={userProfile?.id}
                initialPreferences={userProfile?.preferences}
              >
                <CSPostHogProvider>
                  <TooltipProvider
                    delayDuration={200}
                    skipDelayDuration={500}
                  >
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="dark"
                      enableSystem
                      disableTransitionOnChange
                      storageKey="bob-theme"
                    >
                      <SidebarProvider defaultOpen={false}>
                        <Toaster position="top-center" />
                        {children}
                      </SidebarProvider>
                    </ThemeProvider>
                  </TooltipProvider>
                </CSPostHogProvider>
              </UserPreferencesProvider>
            </ChatSessionProvider>
          </ChatsProvider>
        </ModelProvider>
      </UserProvider>
    </TanstackQueryProvider>
  )
}