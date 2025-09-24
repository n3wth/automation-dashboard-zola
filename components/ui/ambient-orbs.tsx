"use client"

import { motion } from "framer-motion"

export function AmbientOrbs() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              "linear-gradient(120deg, var(--backdrop-gradient-secondary) 0%, transparent 55%, var(--backdrop-gradient-base) 100%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(circle at 18% 20%, var(--backdrop-gradient-glow) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(circle at 82% 80%, var(--backdrop-gradient-accent) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, var(--backdrop-gradient-radial) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="absolute -top-40 -left-40 h-96 w-96 opacity-50 dark:opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.65) 0%, rgba(139, 92, 246, 0.2) 45%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />

      <div
        className="absolute -bottom-32 -right-32 h-80 w-80 opacity-45 dark:opacity-65"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse 10s ease-in-out infinite 2s",
        }}
      />

      <div
        className="absolute top-1/3 -left-20 h-64 w-64 opacity-50 dark:opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(236, 72, 153, 0.18) 40%, transparent 70%)",
          filter: "blur(50px)",
          animation: "pulse 9s ease-in-out infinite 1s",
        }}
      />

      <div
        className="absolute top-20 -right-24 h-72 w-72 opacity-45 dark:opacity-65"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.18) 40%, transparent 70%)",
          filter: "blur(50px)",
          animation: "pulse 11s ease-in-out infinite 3s",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            "radial-gradient(circle, var(--backdrop-gradient-glow) 0%, transparent 65%)",
          filter: "blur(110px)",
          animation: "pulse 14s ease-in-out infinite 4s",
        }}
      />

      <div
        className="absolute inset-0 mix-blend-screen opacity-[0.03] transition-opacity duration-700 dark:mix-blend-soft-light dark:opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
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
