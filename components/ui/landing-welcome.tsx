"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap, MessageSquare, Search, FileText, Users } from "lucide-react"

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    title: "Multi-Model AI",
    description: "Chat with Claude, GPT, Gemini & more",
  },
  {
    icon: Users,
    title: "Compare Responses",
    description: "Run multiple models side-by-side",
  },
  {
    icon: FileText,
    title: "File Support",
    description: "Upload images, docs & code",
  },
  {
    icon: Search,
    title: "Web Search",
    description: "Real-time internet access",
  },
]

const examplePrompts = [
  "Explain quantum computing in simple terms",
  "Help me debug this Python code",
  "Compare React vs Vue for my project",
  "Summarize this research paper",
]

export function LandingWelcome() {
  return (
    <div className="text-center space-y-8 relative z-20">
      {/* Main Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-tight mb-3">
          What&apos;s on your mind?
        </h1>
        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
          Your intelligent AI workspace with access to the world&apos;s best models
        </p>
      </motion.div>

      {/* Feature Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              className="group relative rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <Icon className="w-5 h-5 text-white/80 mb-2 mx-auto group-hover:text-white transition-colors" />
              <h3 className="text-white text-sm font-medium mb-1">
                {feature.title}
              </h3>
              <p className="text-white/60 text-xs leading-snug">
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Example Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-white/60" />
          <p className="text-white/60 text-sm font-medium">Try asking:</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {examplePrompts.map((prompt, index) => (
            <motion.div
              key={prompt}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1.5 text-white/70 text-xs hover:bg-white/10 hover:text-white transition-all duration-200 cursor-default"
            >
              <Zap className="w-3 h-3" />
              <span>{prompt}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
