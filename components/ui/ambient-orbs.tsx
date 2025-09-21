'use client'

import { motion } from 'framer-motion'

export function AmbientOrbs() {
  // Static gradient orbs with fade in/out animation and noise
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Large purple orb - top left */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: 0.5,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      {/* Blue orb - bottom right */}
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: 0.4,
          animation: 'pulse 10s ease-in-out infinite 2s',
        }}
      />

      {/* Pink orb - middle left */}
      <div
        className="absolute top-1/3 -left-20 w-64 h-64"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(236, 72, 153, 0.2) 40%, transparent 70%)',
          filter: 'blur(50px)',
          opacity: 0.4,
          animation: 'pulse 9s ease-in-out infinite 1s',
        }}
      />

      {/* Purple orb - top right */}
      <div
        className="absolute top-20 -right-24 w-72 h-72"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.2) 40%, transparent 70%)',
          filter: 'blur(50px)',
          opacity: 0.35,
          animation: 'pulse 11s ease-in-out infinite 3s',
        }}
      />

      {/* Center subtle glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 60%)',
          filter: 'blur(100px)',
          opacity: 0.3,
          animation: 'pulse 12s ease-in-out infinite 4s',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </motion.div>
  )
}