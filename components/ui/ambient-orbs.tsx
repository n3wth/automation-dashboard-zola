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
      style={{
        background: "linear-gradient(180deg, rgb(15, 0, 26) 0%, rgb(25, 0, 40) 100%)",
      }}
    />
  )
}