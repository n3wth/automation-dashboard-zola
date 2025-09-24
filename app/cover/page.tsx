"use client"

import { Logo } from "@/components/ui/logo"

export default function CoverPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative">
      {/* Background gradient to match main site */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
      </div>

      <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto px-6 relative z-10">
        {/* Logo */}
        <div className="scale-[2.5] mb-8">
          <Logo variant="ascii" size="lg" />
        </div>

        {/* Tagline */}
        <h1 className="text-3xl md:text-4xl font-medium text-center leading-normal whitespace-nowrap">
          Intelligent automation dashboard & multi-model AI chat interface
        </h1>

        {/* Features */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-base font-medium opacity-80">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-blue-500 rounded"></div>
            <span>Multi-Model AI</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-blue-500 rounded"></div>
            <span>Real-time Chat</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-blue-500 rounded"></div>
            <span>Smart Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-blue-500 rounded"></div>
            <span>Automation Tools</span>
          </div>
        </div>
      </div>
    </div>
  )
}