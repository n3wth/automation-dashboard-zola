"use client"

import { motion } from "framer-motion"

export function PixelArtHome() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Simplified Pixel BOB Title */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <svg width="240" height="60" viewBox="0 0 240 60" className="pixelated opacity-80">
          {/* Minimalist B */}
          <rect fill="#9333ea" x="20" y="10" width="6" height="40"/>
          <rect fill="#9333ea" x="26" y="10" width="18" height="6"/>
          <rect fill="#9333ea" x="26" y="27" width="14" height="6"/>
          <rect fill="#9333ea" x="26" y="44" width="18" height="6"/>
          <rect fill="#9333ea" x="44" y="16" width="6" height="11"/>
          <rect fill="#9333ea" x="40" y="33" width="6" height="11"/>

          {/* Minimalist O */}
          <rect fill="#3b82f6" x="70" y="10" width="24" height="6"/>
          <rect fill="#3b82f6" x="64" y="16" width="6" height="28"/>
          <rect fill="#3b82f6" x="94" y="16" width="6" height="28"/>
          <rect fill="#3b82f6" x="70" y="44" width="24" height="6"/>

          {/* Minimalist B */}
          <rect fill="#eab308" x="120" y="10" width="6" height="40"/>
          <rect fill="#eab308" x="126" y="10" width="18" height="6"/>
          <rect fill="#eab308" x="126" y="27" width="14" height="6"/>
          <rect fill="#eab308" x="126" y="44" width="18" height="6"/>
          <rect fill="#eab308" x="144" y="16" width="6" height="11"/>
          <rect fill="#eab308" x="140" y="33" width="6" height="11"/>
        </svg>
      </motion.div>

      {/* Minimal dancing figures */}
      <motion.div
        className="absolute bottom-32 left-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="24" height="36" viewBox="0 0 24 36" className="pixelated">
            <rect fill="#eab308" x="8" y="2" width="8" height="8"/>
            <rect fill="#eab308" x="10" y="10" width="4" height="8"/>
            <rect fill="#eab308" x="6" y="12" width="4" height="2"/>
            <rect fill="#eab308" x="14" y="12" width="4" height="2"/>
            <rect fill="#eab308" x="8" y="18" width="3" height="8"/>
            <rect fill="#eab308" x="13" y="18" width="3" height="8"/>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          animate={{ y: [2, -2, 2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="24" height="36" viewBox="0 0 24 36" className="pixelated">
            <rect fill="#eab308" x="8" y="2" width="8" height="8"/>
            <rect fill="#eab308" x="10" y="10" width="4" height="8"/>
            <rect fill="#eab308" x="6" y="10" width="4" height="2"/>
            <rect fill="#eab308" x="14" y="10" width="4" height="2"/>
            <rect fill="#eab308" x="8" y="18" width="3" height="8"/>
            <rect fill="#eab308" x="13" y="18" width="3" height="8"/>
          </svg>
        </motion.div>
      </motion.div>

      {/* Minimal pixel accents */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" className="pixelated">
            <rect fill="#9333ea" x="3" y="1" width="2" height="2"/>
            <rect fill="#9333ea" x="1" y="3" width="2" height="2"/>
            <rect fill="#9333ea" x="5" y="3" width="2" height="2"/>
            <rect fill="#9333ea" x="3" y="5" width="2" height="2"/>
          </svg>
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