'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class VisualEffectsBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    console.error('Visual effect error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console or error reporting service
    console.error('Visual effect crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback to a simple gradient background if visual effects crash
      return (
        this.props.fallback || (
          <div className="pointer-events-none fixed inset-0 z-0">
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background:
                  "linear-gradient(120deg, var(--backdrop-gradient-secondary) 0%, transparent 55%, var(--backdrop-gradient-base) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 18% 20%, var(--backdrop-gradient-glow) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 82% 80%, var(--backdrop-gradient-accent) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, var(--backdrop-gradient-radial) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
                backgroundSize: "256px 256px",
              }}
            />
          </div>
        )
      )
    }

    return this.props.children
  }
}