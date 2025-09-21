export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private enabled = false

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  start() {
    this.enabled = true
    this.measure()
  }

  stop() {
    this.enabled = false
  }

  private measure = () => {
    if (!this.enabled) return

    this.frameCount++
    const currentTime = performance.now()

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime

      // Log FPS in development
      if (process.env.NODE_ENV === 'development') {
        if (this.fps < 20) {
          console.warn(`⚠️ Low FPS: ${this.fps}`)
        } else if (this.fps < 30) {
          console.log(`📊 FPS: ${this.fps}`)
        }
      }
    }

    requestAnimationFrame(this.measure)
  }

  getFPS(): number {
    return this.fps
  }

  // Performance marks for measuring specific operations
  mark(name: string) {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark: string) {
    if (process.env.NODE_ENV === 'development') {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        if (measure && measure.duration > 100) {
          console.warn(`⏱️ Slow operation "${name}": ${measure.duration.toFixed(2)}ms`)
        }
      } catch (e) {
        // Marks might not exist
      }
    }
  }

  // Check if running in reduced motion mode
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // Memory usage monitoring (Chrome only)
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      }
    }
    return null
  }
}