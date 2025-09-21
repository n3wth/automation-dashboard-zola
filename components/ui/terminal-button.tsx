"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

interface TerminalButtonProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  variant?: "primary" | "secondary" | "ghost"
  terminalStyle?: boolean
}

export function TerminalButton({
  children,
  variant = "primary",
  terminalStyle = true,
  className,
  ...props
}: TerminalButtonProps) {
  const terminalVariants = {
    primary: cn(
      "font-mono uppercase tracking-wider",
      "bg-violet-500 text-black border-violet-400",
      "hover:bg-violet-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
      "transition-all duration-300"
    ),
    secondary: cn(
      "font-mono uppercase tracking-wider",
      "border-2 border-violet-500 text-violet-400 bg-transparent",
      "hover:bg-violet-500 hover:text-black hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
      "transition-all duration-300"
    ),
    ghost: cn(
      "font-mono tracking-wider",
      "text-violet-400 bg-transparent border-none",
      "hover:text-violet-300 hover:bg-violet-500/10",
      "transition-all duration-300"
    ),
  }

  const content = terminalStyle ? (
    <>
      <span className="text-muted-foreground/60">[</span>
      {children}
      <span className="text-muted-foreground/60">]</span>
    </>
  ) : (
    children
  )

  return (
    <Button
      className={cn(terminalVariants[variant], className)}
      {...props}
    >
      {content}
    </Button>
  )
}