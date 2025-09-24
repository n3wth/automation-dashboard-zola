import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black font-medium shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]",
        destructive:
          "bg-red-500 text-white shadow-xs hover:bg-red-600 focus-visible:outline-red-500",
        outline:
          "border border-white/10 bg-transparent backdrop-blur-sm text-white hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
        secondary:
          "bg-white/5 text-white backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
        ghost: "text-white/70 hover:bg-white/5 hover:text-white",
        link: "text-violet-400 underline-offset-4 hover:underline hover:text-violet-300",
        premium:
          "relative bg-gradient-to-r from-white/10 to-white/5 border border-white/10 backdrop-blur-[10px] text-white hover:from-white/15 hover:to-white/8 hover:border-white/20 hover:shadow-[0_10px_40px_rgba(139,92,246,0.15)] animate-shimmer",
        iridescent:
          "relative overflow-hidden bg-black border border-transparent before:absolute before:inset-[-2px] before:bg-gradient-to-r before:from-violet-600 before:via-purple-600 before:to-pink-600 before:rounded-xl before:animate-gradient-shift before:bg-[length:200%_200%] after:absolute after:inset-[1px] after:bg-black after:rounded-xl [&>*]:relative [&>*]:z-10 hover:after:bg-black/90",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-8 rounded-lg gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      suppressHydrationWarning
      {...props}
    />
  )
}

export { Button, buttonVariants }
