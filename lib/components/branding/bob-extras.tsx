// Extra Bob maximalist styling components
import { cn } from "@/lib/utils"
import { BobMascot } from "./bob-mascot"

interface BobMaximalProps {
  className?: string
  variant?: "sparkle" | "wiggle" | "bounce" | "mega"
}

export function BobMaximal({ className, variant = "sparkle" }: BobMaximalProps) {
  const variantClasses = {
    sparkle: "bob-sparkle",
    wiggle: "bob-wiggle",
    bounce: "bob-bounce",
    mega: "bob-sparkle bob-wiggle bob-glow"
  }

  return (
    <div className={cn("inline-block", variantClasses[variant], className)}>
      <BobMascot size="lg" />
    </div>
  )
}

export function BobCelebration({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <BobMascot animated className="bob-sparkle" />
    </div>
  )
}

export function BobThinking({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BobMascot className="bob-wiggle" />
    </div>
  )
}

export function BobSuccess({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BobMascot className="bob-bounce bob-sparkle" />
    </div>
  )
}

// Loading component with Bob personality
export function BobLoading({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 p-4", className)}>
      <BobMascot size="lg" className="bob-wiggle bob-glow" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-0"></div>
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  )
}