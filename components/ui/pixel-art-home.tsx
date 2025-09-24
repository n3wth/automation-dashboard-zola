"use client"

import { motion } from "framer-motion"

export function PixelArtHome() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Layered BOB Title - Inspired by banner */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
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

      {/* Terminal Windows with Messages */}
      <motion.div
        className="absolute top-24 left-8 md:left-16"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.8, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <svg width="120" height="40" viewBox="0 0 120 40" className="pixelated">
          <rect fill="#3b82f6" x="0" y="0" width="120" height="40" rx="2"/>
          <rect fill="#0f172a" x="4" y="4" width="112" height="32"/>
          <rect fill="#fbbf24" x="8" y="8" width="4" height="2"/>
          <rect fill="#fbbf24" x="14" y="8" width="12" height="2"/>
          <rect fill="#fbbf24" x="28" y="8" width="24" height="2"/>
          <rect fill="#fbbf24" x="54" y="8" width="24" height="2"/>
          <rect fill="#fbbf24" x="80" y="8" width="12" height="2"/>
          <rect fill="#fbbf24" x="94" y="8" width="4" height="2"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-32 right-8 md:right-16"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.8, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <svg width="100" height="36" viewBox="0 0 100 36" className="pixelated">
          <rect fill="#3b82f6" x="0" y="0" width="100" height="36" rx="2"/>
          <rect fill="#0f172a" x="4" y="4" width="92" height="28"/>
          <rect fill="#fbbf24" x="8" y="8" width="8" height="2"/>
          <rect fill="#fbbf24" x="18" y="8" width="4" height="2"/>
        </svg>
      </motion.div>

      {/* Dancing Stick Figures - More Dynamic */}
      <motion.div
        className="absolute bottom-28 left-12 md:left-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          animate={{
            y: [-4, 4, -4],
            rotate: [-5, 5, -5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="32" height="48" viewBox="0 0 32 48" className="pixelated">
            {/* Head */}
            <rect fill="#fbbf24" x="10" y="2" width="12" height="12"/>
            <rect fill="#0f172a" x="13" y="5" width="3" height="3"/>
            <rect fill="#0f172a" x="19" y="5" width="3" height="3"/>
            <rect fill="#0f172a" x="13" y="10" width="8" height="2"/>
            {/* Body */}
            <rect fill="#fbbf24" x="14" y="14" width="6" height="10"/>
            {/* Arms up celebrating */}
            <rect fill="#fbbf24" x="4" y="8" width="6" height="3"/>
            <rect fill="#fbbf24" x="24" y="8" width="6" height="3"/>
            {/* Legs dancing */}
            <rect fill="#fbbf24" x="11" y="24" width="4" height="12"/>
            <rect fill="#fbbf24" x="19" y="24" width="4" height="12"/>
            <rect fill="#fbbf24" x="8" y="36" width="6" height="3"/>
            <rect fill="#fbbf24" x="20" y="36" width="6" height="3"/>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-28 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="40" height="48" viewBox="0 0 40 48" className="pixelated">
            {/* Square head character */}
            <rect fill="#0f172a" x="10" y="2" width="20" height="20" stroke="#fbbf24" strokeWidth="2"/>
            <rect fill="#fbbf24" x="15" y="7" width="3" height="3"/>
            <rect fill="#fbbf24" x="22" y="7" width="3" height="3"/>
            <rect fill="#fbbf24" x="15" y="14" width="10" height="2"/>
            {/* Body */}
            <rect fill="#fbbf24" x="17" y="22" width="6" height="10"/>
            {/* Arms */}
            <rect fill="#fbbf24" x="8" y="24" width="8" height="3"/>
            <rect fill="#fbbf24" x="24" y="24" width="8" height="3"/>
            {/* Legs */}
            <rect fill="#fbbf24" x="14" y="32" width="4" height="10"/>
            <rect fill="#fbbf24" x="22" y="32" width="4" height="10"/>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-28 right-12 md:right-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          animate={{
            y: [4, -4, 4],
            rotate: [5, -5, 5]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <svg width="32" height="48" viewBox="0 0 32 48" className="pixelated">
            {/* Head */}
            <rect fill="#fbbf24" x="10" y="2" width="12" height="12"/>
            <rect fill="#0f172a" x="13" y="5" width="3" height="3"/>
            <rect fill="#0f172a" x="19" y="5" width="3" height="3"/>
            <rect fill="#0f172a" x="13" y="10" width="8" height="2"/>
            {/* Body */}
            <rect fill="#fbbf24" x="14" y="14" width="6" height="10"/>
            {/* Arms waving */}
            <rect fill="#fbbf24" x="6" y="12" width="6" height="3"/>
            <rect fill="#fbbf24" x="22" y="16" width="6" height="3"/>
            {/* Legs */}
            <rect fill="#fbbf24" x="11" y="24" width="4" height="12"/>
            <rect fill="#fbbf24" x="19" y="24" width="4" height="12"/>
            <rect fill="#fbbf24" x="8" y="36" width="6" height="3"/>
            <rect fill="#fbbf24" x="20" y="36" width="6" height="3"/>
          </svg>
        </motion.div>
      </motion.div>

      {/* Retro Computer Monitors */}
      <motion.div
        className="absolute bottom-24 right-8 md:right-20"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" className="pixelated">
          <rect fill="#3b82f6" x="4" y="4" width="40" height="28"/>
          <rect fill="#0f172a" x="8" y="8" width="32" height="20"/>
          <rect fill="#fbbf24" x="14" y="13" width="3" height="3"/>
          <rect fill="#fbbf24" x="19" y="13" width="3" height="3"/>
          <rect fill="#fbbf24" x="14" y="20" width="12" height="2"/>
          <rect fill="#3b82f6" x="18" y="32" width="12" height="4"/>
          <rect fill="#3b82f6" x="14" y="36" width="20" height="4"/>
        </svg>
      </motion.div>

      {/* Colorful Pixel Dots */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
        >
          <div
            className="w-1 h-1 md:w-2 md:h-2"
            style={{
              backgroundColor: ['#ec4899', '#3b82f6', '#fbbf24', '#10b981'][Math.floor(Math.random() * 4)]
            }}
          />
        </motion.div>
      ))}

      {/* Plus Signs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`plus-${i}`}
          className="absolute"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            rotate: 360,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            delay: Math.random() * 3,
            repeat: Infinity,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" className="pixelated">
            <rect fill="#3b82f6" x="8" y="2" width="4" height="16"/>
            <rect fill="#3b82f6" x="2" y="8" width="16" height="4"/>
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