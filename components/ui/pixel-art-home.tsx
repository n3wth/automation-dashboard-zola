"use client"

import { motion } from "framer-motion"

export function PixelArtHome() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Pixel Stars */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            delay: Math.random() * 3,
            repeat: Infinity,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="pixelated">
            <rect fill={['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]} x="5" y="2" width="2" height="2"/>
            <rect fill={['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]} x="2" y="5" width="2" height="2"/>
            <rect fill={['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]} x="5" y="5" width="2" height="2"/>
            <rect fill={['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]} x="8" y="5" width="2" height="2"/>
            <rect fill={['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]} x="5" y="8" width="2" height="2"/>
          </svg>
        </motion.div>
      ))}

      {/* Colorful Pixel Dots */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
        >
          <div
            className="w-1 h-1 md:w-2 md:h-2"
            style={{
              backgroundColor: ['#ec4899', '#3b82f6', '#fbbf24', '#10b981', '#a855f7'][Math.floor(Math.random() * 5)]
            }}
          />
        </motion.div>
      ))}

      <style jsx>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
}