import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GlobeIcon } from "@phosphor-icons/react"
import React from "react"
import { PopoverContentAuth } from "./popover-content-auth"

type ButtonSearchProps = {
  isSelected?: boolean
  onToggle?: (isSelected: boolean) => void
  isAuthenticated: boolean
}

export function ButtonSearch({
  isSelected = false,
  onToggle,
  isAuthenticated,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected
    onToggle?.(newState)
  }

  if (!isAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="rounded-full border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/15 transition-all"
            type="button"
            aria-label="Enable web search"
          >
            <GlobeIcon className="size-5" />
            Search
          </Button>
        </PopoverTrigger>
        <PopoverContentAuth />
      </Popover>
    )
  }

  return (
    <Button
      variant="secondary"
      className={cn(
        "rounded-full border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/15 transition-all duration-150 has-[>svg]:px-1.75 md:has-[>svg]:px-3",
        isSelected &&
          "border-[#0091FF]/20 bg-[#0091FF]/10 text-[#0091FF] hover:bg-[#0091FF]/15 hover:text-[#0091FF]"
      )}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={isSelected ? "Disable web search" : "Enable web search"}
      type="button"
    >
      <GlobeIcon className="size-5" />
      <span className="hidden md:block">Search</span>
    </Button>
  )
}
