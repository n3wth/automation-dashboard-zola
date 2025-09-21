"use client"

import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion"
import { TRANSITION_SUGGESTIONS } from "@/lib/motion"
import { AnimatePresence, motion } from "motion/react"
import React, { memo, useCallback, useMemo, useState, useEffect } from "react"
import { SUGGESTIONS as SUGGESTIONS_CONFIG } from "../../../lib/config"

type SuggestionsProps = {
  onValueChange: (value: string) => void
  onSuggestion: (suggestion: string) => void
  value?: string
}

const MotionPromptSuggestion = motion.create(PromptSuggestion)

export const Suggestions = memo(function Suggestions({
  onValueChange,
  onSuggestion,
  value,
}: SuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  if (!value && activeCategory !== null) {
    setActiveCategory(null)
  }

  // Listen for Bob logo click to reset active category
  useEffect(() => {
    const handleBobLogoClick = () => {
      setActiveCategory(null)
    }

    window.addEventListener('bob-logo-clicked', handleBobLogoClick)
    return () => {
      window.removeEventListener('bob-logo-clicked', handleBobLogoClick)
    }
  }, [])

  const activeCategoryData = SUGGESTIONS_CONFIG.find(
    (group) => group.label === activeCategory
  )

  const showCategorySuggestions =
    activeCategoryData && activeCategoryData.items.length > 0

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setActiveCategory(null)
      onSuggestion(suggestion)
      onValueChange("")
    },
    [onSuggestion, onValueChange]
  )

  const handleCategoryClick = useCallback(
    (suggestion: { label: string; prompt: string }) => {
      // When clicking a category, immediately send a contextual message
      // Don't show sub-suggestions or pre-fill the input
      let message = ""

      switch(suggestion.label) {
        case "Development":
          message = "Help me with development"
          break
        case "AI & Automation":
          message = "Help me with AI and automation"
          break
        case "Business Strategy":
          message = "Help me with business strategy"
          break
        case "Product Design":
          message = "Help me with product design"
          break
        case "System Architecture":
          message = "Help me with system architecture"
          break
        case "Content Creation":
          message = "Help me with content creation"
          break
        case "Innovation":
          message = "Help me with innovation"
          break
        case "Marx Meat Projects":
          message = "Tell me about meat"
          // Dispatch custom event to trigger meat mode
          window.dispatchEvent(new CustomEvent('meat-mode-trigger', { detail: { source: 'suggestion' } }))
          break
        default:
          message = `Help me with ${suggestion.label.toLowerCase()}`
      }

      // Send the message directly
      onSuggestion(message)
      onValueChange("") // Keep input clear
    },
    [onSuggestion, onValueChange]
  )

  const suggestionsGrid = useMemo(
    () => (
      <motion.div
        key="suggestions-grid"
        className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0"
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        transition={TRANSITION_SUGGESTIONS}
        style={{
          scrollbarWidth: "none",
        }}
      >
        {SUGGESTIONS_CONFIG.map((suggestion, index) => (
          <MotionPromptSuggestion
            key={suggestion.label}
            onClick={() => handleCategoryClick(suggestion)}
            className="capitalize"
            initial="initial"
            animate="animate"
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.02,
            }}
            variants={{
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
            }}
          >
            <suggestion.icon className="size-4" />
            {suggestion.label}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    ),
    [handleCategoryClick]
  )

  const suggestionsList = useMemo(
    () => (
      <motion.div
        className="flex w-full flex-col space-y-1 px-2"
        key={activeCategoryData?.label}
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: {
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
          },
        }}
        transition={TRANSITION_SUGGESTIONS}
      >
        {activeCategoryData?.items.map((suggestion: string, index: number) => (
          <MotionPromptSuggestion
            key={`${activeCategoryData?.label}-${suggestion}-${index}`}
            highlight={activeCategoryData.highlight}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="block h-full text-left"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
            }}
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.05,
            }}
          >
            {suggestion}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    ),
    [
      handleSuggestionClick,
      activeCategoryData?.highlight,
      activeCategoryData?.items,
      activeCategoryData?.label,
    ]
  )

  return (
    <AnimatePresence mode="wait">
      {showCategorySuggestions ? suggestionsList : suggestionsGrid}
    </AnimatePresence>
  )
})
