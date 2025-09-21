"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeSelection() {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(theme || "system")
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && theme) {
      setSelectedTheme(theme)
    }
  }, [theme, mounted])

  const themes = [
    {
      id: "system",
      name: "System",
      colors: ["#ffffff", "#1a1a1a"],
      description: "Follows your system preference"
    },
    {
      id: "light",
      name: "Light",
      colors: ["#ffffff", "#f8f9fa"],
      description: "Light theme with bright colors"
    },
    {
      id: "dark",
      name: "Dark",
      colors: ["#000000", "#1a1a1a"],
      description: "Dark theme with muted colors"
    },
  ]

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId)
  }

  if (!mounted) {
    return (
      <div>
        <h4 className="mb-3 text-sm font-medium">Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="rounded-lg border border-border p-3 animate-pulse"
            >
              <div className="mb-2 flex space-x-1">
                {theme.colors.map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-full bg-muted"
                  />
                ))}
              </div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-4">
      <h4 className="mb-3 text-sm font-medium">Theme</h4>
      <div className="space-y-2">
        {themes.map((themeOption) => (
          <label
            key={themeOption.id}
            className={cn(
              "relative flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/50",
              selectedTheme === themeOption.id
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border"
            )}
          >
            <input
              type="radio"
              name="theme"
              value={themeOption.id}
              checked={selectedTheme === themeOption.id}
              onChange={() => handleThemeChange(themeOption.id)}
              className="sr-only"
            />
            <div className="flex shrink-0 space-x-1">
              {themeOption.colors.map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    selectedTheme === themeOption.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {selectedTheme === themeOption.id && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium">{themeOption.name}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {themeOption.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
