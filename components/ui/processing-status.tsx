"use client"

import { cn } from "@/lib/utils"

interface ProcessingStatusProps {
  status: "idle" | "processing" | "complete" | "error"
  message?: string
  className?: string
}

export function ProcessingStatus({
  status,
  message = "processing",
  className
}: ProcessingStatusProps) {
  const statusConfig = {
    idle: {
      symbol: ">_",
      color: "text-muted-foreground",
      glow: "",
    },
    processing: {
      symbol: ">_",
      color: "text-violet-400 terminal-glow",
      glow: "processing-pulse",
    },
    complete: {
      symbol: "✓",
      color: "text-emerald-400",
      glow: "",
    },
    error: {
      symbol: "✗",
      color: "text-red-400",
      glow: "",
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn(
      "flex items-center gap-2 font-mono text-sm",
      config.glow,
      className
    )}>
      <span className={cn("font-bold", config.color)}>
        {config.symbol}
      </span>
      <span className={config.color}>
        {message}
        {status === "processing" && (
          <span className="animate-pulse">...</span>
        )}
      </span>
    </div>
  )
}