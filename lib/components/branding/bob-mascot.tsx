// Bob mascot and branding components
import { APP_CONFIG } from "@/lib/constants/app"
import { cn } from "@/lib/utils"

interface BobMascotProps {
  size?: "sm" | "md" | "lg"
  animated?: boolean
  className?: string
}

export function BobMascot({ size = "md", animated = false, className }: BobMascotProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  }

  return (
    <span
      className={cn(
        sizeClasses[size],
        "bob-glow",
        animated && "bob-bounce",
        !animated && "hover:bob-bounce",
        "cursor-default select-none",
        className
      )}
      role="img"
      aria-label="Bob mascot"
    >
      {APP_CONFIG.mascot}
    </span>
  )
}

interface BobGreetingProps {
  type?: "welcome" | "greeting" | "thinking" | "error"
  className?: string
}

export function BobGreeting({ type = "greeting", className }: BobGreetingProps) {
  const message = APP_CONFIG.personality[type]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BobMascot animated={type === "thinking"} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}

export function BobLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <BobMascot />
      <span>{APP_CONFIG.name}</span>
    </div>
  )
}

export function BobTagline({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {APP_CONFIG.tagline}
    </p>
  )
}