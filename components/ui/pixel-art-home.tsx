"use client"

import { motion } from "framer-motion"

export function PixelArtHome() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Layered BOB Title */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <svg width="280" height="80" viewBox="0 0 280 80" className="pixelated">
          {/* Shadow layers for 3D effect */}
          {/* B Shadow */}
          <rect fill="#4a1d70" x="24" y="14" width="8" height="48"/>
          <rect fill="#4a1d70" x="32" y="14" width="24" height="8"/>
          <rect fill="#4a1d70" x="32" y="34" width="20" height="8"/>
          <rect fill="#4a1d70" x="32" y="54" width="24" height="8"/>
          <rect fill="#4a1d70" x="56" y="22" width="8" height="12"/>
          <rect fill="#4a1d70" x="52" y="42" width="8" height="12"/>

          {/* O Shadow */}
          <rect fill="#1e3a8a" x="84" y="14" width="32" height="8"/>
          <rect fill="#1e3a8a" x="76" y="22" width="8" height="32"/>
          <rect fill="#1e3a8a" x="116" y="22" width="8" height="32"/>
          <rect fill="#1e3a8a" x="84" y="54" width="32" height="8"/>

          {/* B Shadow */}
          <rect fill="#713f12" x="144" y="14" width="8" height="48"/>
          <rect fill="#713f12" x="152" y="14" width="24" height="8"/>
          <rect fill="#713f12" x="152" y="34" width="20" height="8"/>
          <rect fill="#713f12" x="152" y="54" width="24" height="8"/>
          <rect fill="#713f12" x="176" y="22" width="8" height="12"/>
          <rect fill="#713f12" x="172" y="42" width="8" height="12"/>

          {/* Main BOB Letters */}
          {/* B */}
          <rect fill="#ec4899" x="20" y="10" width="8" height="48"/>
          <rect fill="#ec4899" x="28" y="10" width="24" height="8"/>
          <rect fill="#ec4899" x="28" y="30" width="20" height="8"/>
          <rect fill="#ec4899" x="28" y="50" width="24" height="8"/>
          <rect fill="#ec4899" x="52" y="18" width="8" height="12"/>
          <rect fill="#ec4899" x="48" y="38" width="8" height="12"/>

          {/* O */}
          <rect fill="#3b82f6" x="80" y="10" width="32" height="8"/>
          <rect fill="#3b82f6" x="72" y="18" width="8" height="32"/>
          <rect fill="#3b82f6" x="112" y="18" width="8" height="32"/>
          <rect fill="#3b82f6" x="80" y="50" width="32" height="8"/>

          {/* B */}
          <rect fill="#fbbf24" x="140" y="10" width="8" height="48"/>
          <rect fill="#fbbf24" x="148" y="10" width="24" height="8"/>
          <rect fill="#fbbf24" x="148" y="30" width="20" height="8"/>
          <rect fill="#fbbf24" x="148" y="50" width="24" height="8"/>
          <rect fill="#fbbf24" x="172" y="18" width="8" height="12"/>
          <rect fill="#fbbf24" x="168" y="38" width="8" height="12"/>
        </svg>
      </motion.div>

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
            opacity: [0, 0.7, 0],
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
            opacity: [0, 0.5, 0],
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