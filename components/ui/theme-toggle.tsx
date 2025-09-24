"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useUserPreferences, type ThemeType } from "@/lib/user-preference-store/provider"
import { Check, Desktop, Moon, Sun } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

const THEME_OPTIONS: Array<{
  id: ThemeType
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    id: "system",
    label: "System",
    description: "Match device settings",
    icon: Desktop,
  },
  {
    id: "light",
    label: "Light",
    description: "Bright background, dark text",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dimmed background, light text",
    icon: Moon,
  },
]

function isThemeType(value?: string | null): value is ThemeType {
  return value === "light" || value === "dark" || value === "system"
}

export function ThemeToggle({ className }: { className?: string }) {
  const { preferences, setTheme: setUserTheme } = useUserPreferences()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (preferences.theme !== theme) {
      setTheme(preferences.theme)
    }
  }, [mounted, preferences.theme, setTheme, theme])

  const activeThemeId = useMemo<ThemeType>(() => {
    if (isThemeType(theme)) {
      return theme
    }
    return preferences.theme
  }, [preferences.theme, theme])

  const handleThemeChange = (value: ThemeType) => {
    setUserTheme(value)
    setTheme(value)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 rounded-full",
          "bg-muted text-muted-foreground",
          className
        )}
        aria-label="Loading theme toggle"
        disabled
      >
        <Sun className="size-4 animate-pulse opacity-70" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full border border-border",
            "bg-background text-foreground hover:bg-muted",
            className
          )}
          aria-label="Toggle theme"
        >
          <Sun
            className={cn(
              "size-4 rotate-0 scale-100 transition-all",
              resolvedTheme === "dark" && "-rotate-90 scale-0"
            )}
          />
          <Moon
            className={cn(
              "absolute size-4 rotate-90 scale-0 transition-all",
              resolvedTheme === "dark" && "rotate-0 scale-100"
            )}
          />
          {activeThemeId === "system" ? (
            <Desktop className="absolute bottom-1 right-1 size-3 text-muted-foreground" />
          ) : null}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handleThemeChange(option.id)}
            className="flex items-start gap-3 px-3 py-2"
          >
            <div className="mt-0.5">
              <option.icon className="size-4" />
            </div>
            <div className="flex flex-1 flex-col text-left">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
            {activeThemeId === option.id ? (
              <Check className="size-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
