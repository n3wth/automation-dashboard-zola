"use client"

import XIcon from "@/components/icons/x"
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/lib/user-store/provider"
import { GithubLogoIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { AppInfoTrigger } from "./app-info/app-info-trigger"
import { FeedbackTrigger } from "./feedback/feedback-trigger"
import { SettingsTrigger } from "./settings/settings-trigger"

export function UserMenu() {
  const { user } = useUser()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [devUser, setDevUser] = useState<{ name: string; type: string } | null>(null)

  // Check for dev user (only in development)
  useEffect(() => {
    // Only check for dev users in development environment
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const devUserName = localStorage.getItem('devUserName')
      const devUserType = localStorage.getItem('devUserType')
      if (devUserName && devUserType) {
        setDevUser({ name: devUserName, type: devUserType })
      }
    }
  }, [])

  // Use dev user if no real user
  const displayUser = user || (devUser ? {
    display_name: devUser.name,
    profile_image: "",
    email: `${devUser.type}@dev.local`
  } : null)

  if (!displayUser) return null

  const handleSettingsOpenChange = (isOpen: boolean) => {
    setSettingsOpen(isOpen)
    if (!isOpen) {
      setMenuOpen(false)
    }
  }

  return (
    // fix shadcn/ui / radix bug when dialog into dropdown menu
    <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen} modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger>
            <AvatarWithFallback
              src={displayUser?.profile_image}
              fallbackIdentifier={displayUser?.email || displayUser?.display_name || 'user'}
              className="bg-muted hover:bg-muted/80"
            />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Profile</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (isSettingsOpen) {
            e.preventDefault()
            return
          }
          setMenuOpen(false)
        }}
      >
        <DropdownMenuItem className="flex flex-col items-start gap-0 no-underline hover:bg-transparent focus:bg-transparent">
          <span>{displayUser?.display_name}</span>
          <span className="text-muted-foreground max-w-full truncate">
            {displayUser?.email}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SettingsTrigger onOpenChange={handleSettingsOpenChange} />
        <FeedbackTrigger />
        <AppInfoTrigger />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://x.com/zoladotchat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <XIcon className="size-4 p-0.5" />
            <span>@zoladotchat</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://github.com/ibelick/zola"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <GithubLogoIcon className="size-4" />
            <span>GitHub</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
