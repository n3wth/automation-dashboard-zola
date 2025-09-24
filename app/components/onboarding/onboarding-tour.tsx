"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  BrainIcon,
  ChatsCircleIcon,
  CompassIcon,
  RocketLaunchIcon,
  SparkleIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"

type OnboardingTourProps = {
  onComplete: () => void
  onSkip: () => void
  onPrefillPrompt: (value: string) => void
}

type Feature = {
  id: string
  title: string
  summary: string
  description: string
  highlights: string[]
  icon: typeof ChatsCircleIcon
}

type PromptExample = {
  id: string
  label: string
  prompt: string
  helper: string
}

type ModelHighlight = {
  icon: typeof SparkleIcon
  title: string
  description: string
}

type ModelCategory = {
  id: string
  label: string
  description: string
  models: string[]
  highlights: ModelHighlight[]
}

type Step = {
  id: "features" | "questions" | "models"
  title: string
  description: string
}

const TOUR_STEPS: Step[] = [
  {
    id: "features",
    title: "Welcome! Let’s get you oriented",
    description:
      "Bob is your command center for multi-model chat, automations, and team knowledge. Explore the workspace before you send your first message.",
  },
  {
    id: "questions",
    title: "Ask questions Bob can act on",
    description:
      "Great prompts mix context, goals, and the output you expect. Use these patterns to help Bob deliver the answer you need on the first try.",
  },
  {
    id: "models",
    title: "Pick the right model for every job",
    description:
      "Swap models from the toolbar or compare several at once. Here’s a cheat sheet for what’s available in Bob today.",
  },
]

const FEATURES: Feature[] = [
  {
    id: "workspace",
    title: "Chat workspace",
    summary: "Chat, search, and upload in one canvas",
    description:
      "Keep focused on the conversation. Draft ideas, drop in screenshots or docs, and turn on web search when you need live context.",
    highlights: [
      "Drafts save automatically so you never lose a thought.",
      "Add files or pasted images to ground answers with your own context.",
      "Shift+Enter adds a new line, Enter sends instantly.",
    ],
    icon: ChatsCircleIcon,
  },
  {
    id: "projects",
    title: "Projects & automations",
    summary: "Organize research and ship automations",
    description:
      "Group related chats into a project, promote the best answers, and publish them as reusable automations for your team.",
    highlights: [
      "Turn a great response into a shareable workflow in one click.",
      "Invite teammates to collaborate and reuse prompts across projects.",
      "Project timelines keep recent chats and context together.",
    ],
    icon: SquaresFourIcon,
  },
  {
    id: "multimodel",
    title: "Multi-model view",
    summary: "Compare models side-by-side",
    description:
      "Curious how Claude stacks up against GPT-4o or Gemini? Switch to the multi-model view to send one prompt to several models at once.",
    highlights: [
      "Pin the best response and ask follow-up questions to all models together.",
      "Mix fast, cheap models with flagship reasoning models in a single run.",
      "Use the same attachments across every model you evaluate.",
    ],
    icon: RocketLaunchIcon,
  },
]

const PROMPT_TIPS: { title: string; description: string }[] = [
  {
    title: "Set the scene",
    description:
      "Share who or what you’re working on, constraints, and any existing artifacts. The more context, the better the answer.",
  },
  {
    title: "Specify the deliverable",
    description:
      "Ask for a format, tone, or checklist. Bob can draft emails, code, PRDs, or SQL — just tell it the structure you expect.",
  },
  {
    title: "Iterate like a teammate",
    description:
      "Follow up on any step. Highlight message text to quote it back, or attach new data when you need Bob to reconsider.",
  },
]

const PROMPT_EXAMPLES: PromptExample[] = [
  {
    id: "debug",
    label: "Debug an API failure",
    prompt:
      "I’m receiving intermittent 500 errors from our billing webhook. Analyze the attached log excerpt, list likely root causes, and propose targeted fixes.",
    helper: "Adds log context and asks for prioritized actions.",
  },
  {
    id: "analysis",
    label: "Summarize customer feedback",
    prompt:
      "You’re a product analyst. Cluster these survey responses into themes, surface the top pain points, and draft three follow-up questions for user interviews.",
    helper: "Guides Bob to synthesize, prioritize, and continue the research.",
  },
  {
    id: "strategy",
    label: "Plan a launch campaign",
    prompt:
      "Using the attached brief, outline a two-week launch plan with owned, earned, and paid tactics. Include success metrics and a one-slide executive summary.",
    helper: "Pairs context with a clear output format.",
  },
]

const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: "general",
    label: "Daily driver",
    description:
      "Balanced models ideal for brainstorming, writing, and research. Start here for most conversations.",
    models: ["GPT-4o mini", "Claude 3.5 Sonnet", "Gemini 1.5 Pro"],
    highlights: [
      {
        icon: SparkleIcon,
        title: "Reliable writing & analysis",
        description: "Great at summarizing long inputs, drafting copy, and answering open-ended questions with citations when available.",
      },
      {
        icon: CompassIcon,
        title: "Understands nuanced instructions",
        description: "Handles tone adjustments, persona shifts, and structured output requirements without heavy prompting.",
      },
    ],
  },
  {
    id: "reasoning",
    label: "Deep reasoning",
    description:
      "Use these when you need multi-step thinking, complex coding help, or precise planning.",
    models: ["GPT-4.1", "Claude 3.7 Sonnet", "DeepSeek R1"],
    highlights: [
      {
        icon: BrainIcon,
        title: "Multi-step problem solving",
        description: "Breaks down tricky tickets, writes tests, and justifies each recommendation in detail.",
      },
      {
        icon: SparkleIcon,
        title: "Tool-friendly",
        description: "Great partners for structured automations or function calling flows you build in Bob.",
      },
    ],
  },
  {
    id: "creative",
    label: "Creative & multimodal",
    description:
      "Bring visuals, speech, and outside knowledge into the mix. Perfect for storytelling, design, and live data pulls.",
    models: ["GPT-4o", "Gemini 1.5 Flash", "Perplexity Sonar"],
    highlights: [
      {
        icon: RocketLaunchIcon,
        title: "Vision & audio aware",
        description: "Understand screenshots, diagrams, and voice notes to answer with richer context.",
      },
      {
        icon: CompassIcon,
        title: "Research that cites sources",
        description: "Pulls in fresh information and links so you can double-check every fact.",
      },
    ],
  },
]

export function OnboardingTour({ onComplete, onSkip, onPrefillPrompt }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [activeFeature, setActiveFeature] = useState(FEATURES[0]?.id ?? "workspace")
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [activeModelCategory, setActiveModelCategory] = useState(
    MODEL_CATEGORIES[0]?.id ?? "general"
  )

  const activeStep = TOUR_STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === TOUR_STEPS.length - 1

  const progressValue = useMemo(() => {
    return ((stepIndex + 1) / TOUR_STEPS.length) * 100
  }, [stepIndex])

  const featureDetails = useMemo(() => {
    return FEATURES.find((feature) => feature.id === activeFeature) ?? FEATURES[0]
  }, [activeFeature])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
      return
    }

    setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1))
  }

  const handleBack = () => {
    if (isFirstStep) {
      return
    }

    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const handlePromptExample = (example: PromptExample) => {
    onPrefillPrompt(example.prompt)
    setSelectedPromptId(example.id)

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const textarea = window.document.querySelector<HTMLTextAreaElement>(
          'textarea[placeholder*="Ask" i]'
        )

        if (textarea) {
          textarea.focus()
          const length = textarea.value.length
          textarea.setSelectionRange(length, length)
        }
      })
    }
  }

  return (
    <div className="bg-black/70 text-white/90 relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
      <div className="text-white/60 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
        <span>Guided tour</span>
        <span>
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </span>
      </div>

      <Progress value={progressValue} className="mt-3 h-[5px]" />

      <motion.div
        key={activeStep.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-6"
      >
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {activeStep.title}
        </h2>
        <p className="text-white/70 mt-3 text-sm sm:text-base">
          {activeStep.description}
        </p>
      </motion.div>

      <div className="mt-8 space-y-6">
        <AnimatePresence initial={false} mode="wait">
          {activeStep.id === "features" ? (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="grid gap-2 sm:grid-cols-3">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon
                  const isActive = feature.id === activeFeature

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => setActiveFeature(feature.id)}
                      className={cn(
                        "border-white/10 bg-white/5 hover:bg-white/10 focus-visible:outline-violet-500/70 group flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition", 
                        isActive && "border-white/40 bg-white/15 shadow-[0_10px_30px_rgba(148,163,184,0.25)]"
                      )}
                    >
                      <Icon className="text-violet-200 size-5" weight={isActive ? "fill" : "regular"} />
                      <div>
                        <p className="font-medium text-sm text-white">
                          {feature.title}
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed">
                          {feature.summary}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <motion.div
                key={featureDetails?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="border-white/10 bg-white/5 relative overflow-hidden rounded-3xl border p-6 backdrop-blur"
              >
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative space-y-3">
                  <h3 className="text-white text-lg font-semibold">
                    {featureDetails?.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {featureDetails?.description}
                  </p>
                  <ul className="text-white/70 space-y-2 text-sm">
                    {featureDetails?.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-1 inline-block size-1.5 flex-shrink-0 rounded-full bg-violet-300" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ) : null}

          {activeStep.id === "questions" ? (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {PROMPT_TIPS.map((tip) => (
                  <div
                    key={tip.title}
                    className="border-white/10 bg-white/5 h-full rounded-2xl border p-4"
                  >
                    <p className="font-medium text-sm text-white">{tip.title}</p>
                    <p className="text-white/70 mt-2 text-sm leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-white/10 bg-black/40 rounded-3xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">Try a ready-made prompt</p>
                    <p className="text-white/60 text-sm">
                      Clicking one will prefill the chat box so you can tweak it before sending.
                    </p>
                  </div>
                  {selectedPromptId ? (
                    <span className="text-emerald-300 text-xs font-medium uppercase tracking-wide">
                      Added to input
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {PROMPT_EXAMPLES.map((example) => {
                    const isSelected = selectedPromptId === example.id

                    return (
                      <button
                        key={example.id}
                        type="button"
                        onClick={() => handlePromptExample(example)}
                        className={cn(
                          "border-white/10 hover:border-white/30 hover:bg-white/10 flex h-full flex-col justify-between rounded-2xl border p-4 text-left transition",
                          isSelected && "border-emerald-300/80 bg-emerald-300/10 shadow-[0_8px_30px_rgba(16,185,129,0.35)]"
                        )}
                      >
                        <div className="space-y-2">
                          <p className="text-white text-sm font-medium">
                            {example.label}
                          </p>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {example.helper}
                          </p>
                        </div>
                        <span className="text-white/60 mt-3 block text-xs leading-relaxed">
                          “{example.prompt}”
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}

          {activeStep.id === "models" ? (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <Tabs value={activeModelCategory} onValueChange={setActiveModelCategory}>
                <TabsList className="border-white/10 bg-black/40 flex-wrap gap-2 rounded-2xl border p-1">
                  {MODEL_CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="data-[state=active]:bg-white/15 data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-medium text-white/60"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {MODEL_CATEGORIES.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-4">
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="border-white/10 bg-white/5 space-y-4 rounded-3xl border p-6"
                    >
                      <div className="space-y-3">
                        <p className="text-white/80 text-sm leading-relaxed">
                          {category.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.models.map((model) => (
                            <span
                              key={model}
                              className="border-white/20 bg-black/40 text-white/80 rounded-full border px-3 py-1 text-xs"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {category.highlights.map((highlight) => {
                          const Icon = highlight.icon

                          return (
                            <div
                              key={highlight.title}
                              className="border-white/10 bg-black/40 flex items-start gap-3 rounded-2xl border p-4"
                            >
                              <span className="bg-violet-500/20 text-violet-200 mt-1 flex size-9 items-center justify-center rounded-xl">
                                <Icon className="size-5" weight="fill" />
                              </span>
                              <div className="space-y-1">
                                <p className="text-white text-sm font-medium">
                                  {highlight.title}
                                </p>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  {highlight.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="border-white/10 bg-black/30 rounded-2xl border p-4 text-sm text-white/70">
                <p>
                  Use the model selector next to the send button to switch anytime. Want to compare a few at once? Open the header menu and toggle the multi-model view.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="justify-start text-white/70 hover:text-white"
          onClick={onSkip}
        >
          Skip tour
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
            className="border-white/20 text-white/80 disabled:opacity-40"
          >
            Back
          </Button>
          <Button type="button" onClick={handleNext} className="min-w-[140px]">
            {isLastStep ? "Start chatting" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
