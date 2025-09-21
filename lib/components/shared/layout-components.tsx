// Shared layout components for consistent styling
// Consolidates common layout patterns used across components

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface FlexContainerProps {
  children: ReactNode
  direction?: "row" | "col"
  gap?: "none" | "sm" | "md" | "lg"
  className?: string
}

export function FlexContainer({
  children,
  direction = "col",
  gap = "md",
  className
}: FlexContainerProps) {
  return (
    <div className={cn(
      "flex",
      direction === "col" ? "flex-col" : "flex-row",
      gap === "none" && "space-y-0",
      gap === "sm" && "space-y-1",
      gap === "md" && "space-y-2",
      gap === "lg" && "space-y-4",
      className
    )}>
      {children}
    </div>
  )
}

interface ScrollContainerProps {
  children: ReactNode
  className?: string
  maxHeight?: string
}

export function ScrollContainer({
  children,
  className,
  maxHeight = "320px"
}: ScrollContainerProps) {
  return (
    <div className={cn(
      "overflow-y-auto",
      className
    )} style={{ maxHeight }}>
      {children}
    </div>
  )
}

interface PopoverContainerProps {
  children: ReactNode
  width?: number
  height?: number
  className?: string
}

export function PopoverContainer({
  children,
  width = 300,
  height = 320,
  className
}: PopoverContainerProps) {
  return (
    <div
      className={cn(
        "bg-popover flex flex-col space-y-0.5 overflow-visible p-0",
        className
      )}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {children}
    </div>
  )
}

interface StickyHeaderProps {
  children: ReactNode
  className?: string
}

export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <div className={cn(
      "bg-popover sticky top-0 z-10 rounded-t-md border-b px-0 pt-0 pb-0",
      className
    )}>
      {children}
    </div>
  )
}

interface MenuItemProps {
  children: ReactNode
  selected?: boolean
  locked?: boolean
  onClick?: () => void
  className?: string
}

export function MenuItem({
  children,
  selected = false,
  locked = false,
  onClick,
  className
}: MenuItemProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 cursor-pointer transition-colors",
        selected && "bg-accent",
        locked && "opacity-75",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}