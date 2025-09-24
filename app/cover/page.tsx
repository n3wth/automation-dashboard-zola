"use client"

import { Logo } from "@/components/ui/logo"
import { useEffect } from "react"

export default function CoverPage() {
  useEffect(() => {
    // Hide Next.js dev indicators
    const style = document.createElement('style')
    style.textContent = `
      /* Hide ALL dev tools and browser elements */
      button,
      [data-nextjs-toast],
      [data-nextjs-dialog],
      [class*="nextjs"],
      [aria-label*="Next.js"],
      [role="alert"],
      alert,
      div[style*="position: fixed"],
      div[style*="position: absolute"][style*="z-index"],
      .dev-tools,
      .browser-dev-tools,
      [style*="outline"],
      [data-inspector],
      [class*="inspector"],
      [class*="dev-"],
      [id*="dev-"] {
        display: none !important;
        visibility: hidden !important;
        outline: none !important;
        border: none !important;
      }

      /* Ensure clean layout */
      body {
        overflow: hidden;
      }

      /* Responsive icon sizing */
      .feature-icon {
        width: clamp(20px, 3vw, 32px);
        height: clamp(20px, 3vw, 32px);
      }

      /* Logo proportional scaling - contained and centered */
      [alt="Bob"] {
        width: clamp(300px, 25vw, 500px) !important;
        height: auto !important;
        object-fit: contain;
        display: block !important;
        margin-left: auto !important;
        margin-right: auto !important;
        max-width: 80vw !important;
        text-align: center !important;
      }

      /* Ensure logo container is centered */
      .logo-container {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        width: 100% !important;
      }
    `
    document.head.appendChild(style)

    // Additional JavaScript cleanup - aggressive dev hiding
    const hideDevElements = () => {
      // Hide all buttons and dev indicators
      document.querySelectorAll('button, [class*="nextjs"], [data-nextjs], [style*="position: fixed"]').forEach(el => {
        const htmlEl = el as HTMLElement
        htmlEl.style.display = 'none'
        htmlEl.style.visibility = 'hidden'
        el.remove()
      })

      // Specifically target the N indicator
      document.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement
        if (el.textContent?.trim() === 'N' &&
            (htmlEl.style.position === 'fixed' || htmlEl.style.position === 'absolute')) {
          el.remove()
        }
      })
    }

    hideDevElements()

    const observer = new MutationObserver(() => {
      hideDevElements()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white relative overflow-hidden">
      {/* Clean black background for cover */}

      <div className="flex flex-col items-center justify-center space-y-[8vh] w-full h-full px-[5vw] relative z-10">
        {/* Logo */}
        <div className="w-full flex justify-center items-center logo-container">
          <Logo variant="ascii" size="xl" />
        </div>

        {/* Tagline */}
        <h1 className="text-[clamp(2rem,5vw,4rem)] font-medium text-center leading-tight max-w-[80vw]">
          Intelligent automation dashboard & multi-model AI chat interface
        </h1>
      </div>
    </div>
  )
}