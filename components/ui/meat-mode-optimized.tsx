'use client'

import { useEffect, useRef, useCallback } from 'react'

interface MeatParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  type: 'steak' | 'bacon' | 'ham' | 'sausage'
  rotation: number
  rotationSpeed: number
  emoji: string
}

// Pre-compute emoji map for performance
const MEAT_EMOJIS = {
  steak: '🥩',
  bacon: '🥓',
  ham: '🍖',
  sausage: '🌭'
} as const

export function MeatMode({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<MeatParticle[]>([])
  const frameRef = useRef(0)
  const rafIdRef = useRef<number>(0)
  const isVisibleRef = useRef(true)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Memoized particle initialization
  const initMeatParticles = useCallback((width: number, height: number) => {
    // Reduce particle count for performance
    const particleCount = window.innerWidth < 768 ? 15 : 20

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const type = (['steak', 'bacon', 'ham', 'sausage'] as const)[Math.floor(Math.random() * 4)]
      return {
        x: Math.random() * width,
        y: Math.random() * height - height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2.5 + 1.5,
        size: Math.random() * 60 + 25,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        emoji: MEAT_EMOJIS[type]
      }
    })
  }, [])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Get context with performance optimizations
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    })
    if (!ctx) return

    ctxRef.current = ctx

    // Optimized resize with debouncing
    let resizeTimeout: NodeJS.Timeout
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Reinitialize particles on resize
      if (particlesRef.current.length === 0) {
        initMeatParticles(width, height)
      }
    }

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 200)
    }

    resizeCanvas()

    // Visibility handling for performance
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
    }

    // Optimized animation loop
    let lastTime = 0
    const targetFPS = 30
    const frameDuration = 1000 / targetFPS

    const animate = (currentTime: number) => {
      // FPS limiting
      const deltaTime = currentTime - lastTime
      if (deltaTime < frameDuration) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }
      lastTime = currentTime

      // Skip if tab is not visible
      if (!isVisibleRef.current) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }

      frameRef.current++

      // Clear canvas efficiently
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Batch particle rendering
      ctx.save()
      ctx.globalAlpha = 0.85

      // Only apply shadows every 3rd frame for performance
      const applyShadows = frameRef.current % 3 === 0
      if (applyShadows) {
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(200, 0, 0, 0.4)'
      }

      particlesRef.current.forEach((particle) => {
        // Update physics
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed

        // Add drift occasionally
        if (frameRef.current % 20 === 0) {
          particle.vx += (Math.random() - 0.5) * 0.05
        }

        // Reset off-screen particles
        if (particle.y > window.innerHeight + particle.size) {
          particle.y = -particle.size
          particle.x = Math.random() * window.innerWidth
          particle.vx = (Math.random() - 0.5) * 2
        }

        // Wrap horizontally
        const buffer = particle.size
        if (particle.x < -buffer) particle.x = window.innerWidth + buffer
        if (particle.x > window.innerWidth + buffer) particle.x = -buffer

        // Render particle efficiently
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.font = `${particle.size}px serif`
        ctx.fillText(particle.emoji, -particle.size/2, particle.size/2)
        ctx.restore()
      })

      ctx.restore()
      rafIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleResize, { passive: true })
    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isActive, initMeatParticles])

  if (!isActive) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[1] opacity-85"
        style={{
          imageRendering: 'pixelated' as const,
          willChange: 'contents'
        }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 pointer-events-none z-[2]">
        {/* Simplified overlays using CSS animations instead of JS */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-red-800/20" />

        {/* Use CSS animations with GPU acceleration */}
        <div className="meat-text-overlay absolute top-10 left-10 text-red-500/20 text-7xl font-black select-none">
          MEAT
        </div>
        <div className="meat-text-overlay absolute bottom-20 right-20 text-orange-600/20 text-5xl font-black select-none animation-delay-300">
          PROTEIN
        </div>
        <div className="meat-text-overlay absolute top-1/2 left-1/3 text-red-700/20 text-6xl font-black select-none animation-delay-700">
          CARNIVORE
        </div>
      </div>

      <style jsx>{`
        .meat-text-overlay {
          transform: translateZ(0) rotate(12deg);
          animation: meat-pulse 3s ease-in-out infinite;
          will-change: opacity;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
          transform: translateZ(0) rotate(-6deg);
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
          transform: translateZ(0) rotate(45deg);
        }

        @keyframes meat-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  )
}