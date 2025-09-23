"use client"

import { AmbientOrbs } from "@/components/ui/ambient-orbs"
import { VisualEffectsBoundary } from "@/components/ui/visual-effects-boundary"
import { Header } from "@/app/components/layout/header"
import { AppSidebar } from "@/app/components/layout/sidebar/app-sidebar"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useState, useEffect, lazy, Suspense } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Lazy load MeatMode for better initial performance
const MeatMode = lazy(() => import("@/components/ui/meat-mode").then((module) => {
  return { default: module.MeatMode }
}))

export function LayoutApp({ children }: { children: React.ReactNode }) {
  const { preferences } = useUserPreferences()
  const hasSidebar = preferences.layout === "sidebar"
  const [isMeatMode, setIsMeatMode] = useState(false) // Start with meat mode OFF
  const [hasTriggeredMeatMode, setHasTriggeredMeatMode] = useState(false) // Track if meat mode was triggered in this session

  // Check for meat mode activation - only on submitted messages
  useEffect(() => {
    const checkForMeatMode = (event?: Event) => {
      // Only activate meat mode if not already triggered and message is being sent
      if (hasTriggeredMeatMode) return // Once triggered, stay active for session

      // Listen for form submission or Enter key to check the actual sent message
      const inputField = document.querySelector('textarea, input[type="text"]') as HTMLInputElement | HTMLTextAreaElement

      // Only check when the message is actually being sent (on form submit or Enter key)
      if (event && (event.type === 'submit' || (event as KeyboardEvent).key === 'Enter')) {
        if (inputField?.value) {
          // Only check for exact words "meat" or "marx" (case-insensitive, whole words)
          const triggers = ['meat', 'marx']
          const hasTriggersInInput = triggers.some(trigger => {
            const regex = new RegExp(`\\b${trigger}\\b`, 'i')
            return regex.test(inputField.value)
          })

          if (hasTriggersInInput) {
            console.log('Meat mode triggered by sent message:', inputField.value)
            setIsMeatMode(true)
            setHasTriggeredMeatMode(true) // Remember that we triggered it
          }
        }
      }
    }

    // Handle Bob click to reset meat mode and categories with improved detection
    const handleBobClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // More comprehensive logo detection
      const checkElement = (el: HTMLElement | null): boolean => {
        if (!el) return false

        // Check various logo indicators
        const isLink = el.tagName === 'A' && el.getAttribute('href') === '/'
        const isImage = el.tagName === 'IMG' && (
          (el as HTMLImageElement).alt?.toLowerCase().includes('bob') ||
          (el as HTMLImageElement).src?.includes('logo')
        )
        const className = typeof el.className === 'string' ? el.className : ''
        const hasLogoClass = className.toLowerCase().includes('logo')
        const ariaLabel = el.getAttribute('aria-label')
        const hasLogoAttribute = el.hasAttribute('data-logo') || (!!ariaLabel && ariaLabel.toLowerCase().includes('logo'))

        return isLink || isImage || hasLogoClass || hasLogoAttribute
      }

      // Check target and all parent elements up to body
      let currentElement: HTMLElement | null = target
      let isLogoClick = false

      while (currentElement && currentElement !== document.body) {
        if (checkElement(currentElement)) {
          isLogoClick = true
          break
        }
        // Also check if it's within a header home link
        if (currentElement.closest('header a[href="/"]')) {
          isLogoClick = true
          break
        }
        currentElement = currentElement.parentElement
      }

      if (isLogoClick) {
        console.log('Bob logo clicked - resetting everything')
        // Reset meat mode
        setIsMeatMode(false)
        setHasTriggeredMeatMode(false) // Allow retriggering

        // Clear model search filter to show all categories
        const modelSearchInput = document.querySelector('input[placeholder*="Search model" i]') as HTMLInputElement
        if (modelSearchInput) {
          modelSearchInput.value = ''
          // Trigger input event to update the search
          const event = new Event('input', { bubbles: true })
          modelSearchInput.dispatchEvent(event)
        }

        // Clear any text in the main chat input to reset active category
        const chatInput = document.querySelector('textarea[placeholder*="chat" i], textarea[placeholder*="message" i], textarea[placeholder*="Ask" i]') as HTMLTextAreaElement
        if (chatInput) {
          chatInput.value = ''
          // Trigger input event to reset suggestions and clear any typed text
          const inputEvent = new Event('input', { bubbles: true })
          chatInput.dispatchEvent(inputEvent)
          // Also trigger change event for good measure
          const changeEvent = new Event('change', { bubbles: true })
          chatInput.dispatchEvent(changeEvent)
        }

        // Dispatch custom event for any components that need to reset
        window.dispatchEvent(new CustomEvent('bob-logo-clicked', { detail: { resetCategories: true } }))
      }
    }

    // Listen for form submission
    const handleSubmit = (e: Event) => {
      checkForMeatMode(e)
    }

    // Listen for Enter key in input fields
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          checkForMeatMode(e)
        }
      }
    }

    // Listen for meat mode trigger from suggestions
    const handleMeatModeTrigger = () => {
      console.log('Meat mode triggered by suggestion click')
      setIsMeatMode(true)
      setHasTriggeredMeatMode(true)
    }

    // Add event listeners
    document.addEventListener('submit', handleSubmit, true) // Capture phase to get it before form handling
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', handleBobClick)
    window.addEventListener('meat-mode-trigger', handleMeatModeTrigger)

    return () => {
      document.removeEventListener('submit', handleSubmit, true)
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('click', handleBobClick)
      window.removeEventListener('meat-mode-trigger', handleMeatModeTrigger)
    }
  }, [hasTriggeredMeatMode])

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden relative">
      <VisualEffectsBoundary>
        <AnimatePresence mode="wait">
          {isMeatMode ? (
            <motion.div
              key="meat-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="fixed inset-0"
            >
              <Suspense fallback={<div className="fixed inset-0 bg-red-900/10 animate-pulse" />}>
                <MeatMode isActive={true} />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="ambient-orbs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="fixed inset-0"
            >
              <AmbientOrbs />
            </motion.div>
          )}
        </AnimatePresence>
      </VisualEffectsBoundary>
      {hasSidebar && <AppSidebar />}
      <main className="@container relative h-dvh w-0 flex-shrink flex-grow overflow-y-auto">
        <Header hasSidebar={hasSidebar} />
        {children}
      </main>
    </div>
  )
}
