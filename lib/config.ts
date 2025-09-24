import {
  BookOpenText,
  Brain,
  Code,
  Lightbulb,
  Notepad,
  PaintBrush,
  Sparkle,
  Hamburger,
} from "@phosphor-icons/react/dist/ssr"

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 1000
export const AUTH_DAILY_MESSAGE_LIMIT = 1000
export const REMAINING_QUERY_ALERT_THRESHOLD = 2
export const DAILY_FILE_UPLOAD_LIMIT = 5
export const DAILY_LIMIT_PRO_MODELS = 500

export const NON_AUTH_ALLOWED_MODELS = ["gpt-4.1-nano"]

export const FREE_MODELS_IDS = [
  "openrouter:deepseek/deepseek-r1:free",
  "openrouter:meta-llama/llama-3.3-8b-instruct:free",
  "pixtral-large-latest",
  "mistral-large-latest",
  "gpt-4.1-nano",
]

export const MODEL_DEFAULT = "gpt-4.1-nano"

export const APP_NAME = "Bob by Newth.ai"
export const APP_DOMAIN = "https://bob.newth.ai"

export const SUGGESTIONS = [
  {
    label: "Development",
    highlight: "Help me build",
    prompt: `Help me build`,
    items: [
      "Build a React component",
      "Optimize Next.js performance",
      "Add error boundaries",
      "Set up Playwright testing",
    ],
    icon: Code,
  },
  {
    label: "AI & Automation",
    highlight: "Create automation",
    prompt: `Create automation`,
    items: [
      "Build daily automation workflow",
      "Create Claude-powered system",
      "Set up CI/CD pipeline",
      "Build AI data processing",
    ],
    icon: Brain,
  },
  {
    label: "Business Strategy",
    highlight: "Analyze",
    prompt: `Analyze`,
    items: [
      "Scale business model",
      "Analyze market positioning",
      "Turn feedback into features",
      "Find optimization opportunities",
    ],
    icon: BookOpenText,
  },
  {
    label: "Product Design",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design user dashboard",
      "Create smooth onboarding",
      "Build component system",
      "Simplify complex workflows",
    ],
    icon: PaintBrush,
  },
  {
    label: "System Architecture",
    highlight: "Plan",
    prompt: `Plan`,
    items: [
      "Architect microservices",
      "Design database schema",
      "Build deployment pipeline",
      "Set up monitoring",
    ],
    icon: Lightbulb,
  },
  {
    label: "Content Creation",
    highlight: "Write",
    prompt: `Write`,
    items: [
      "Write technical documentation",
      "Craft product copy",
      "Write blog post",
      "Create user stories",
    ],
    icon: Notepad,
  },
  {
    label: "Innovation",
    highlight: "Explore",
    prompt: `Explore`,
    items: [
      "Discover AI tools",
      "Find new frameworks",
      "Identify automation opportunities",
      "Optimize workflow",
    ],
    icon: Sparkle,
  },
  {
    label: "Marx Meat Projects",
    highlight: "Seize the meat",
    prompt: `Seize the meat`,
    items: [
      "Build quantum meat teleportation network",
      "Create AI-powered communist bacon oracle",
      "Design blockchain meat democracy",
      "Develop revolutionary meat subscription",
    ],
    icon: Hamburger,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `You are Bob, an intelligent assistant by Newth.ai. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don't try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.

SPECIAL MODE: When discussing meat, Marx, or anything related to "seizing the meat," become wildly creative and generate absolutely bonkers ideas involving revolutionary meat concepts, quantum BBQ technology, communist food distribution, AI-powered meat democracy, blockchain butcher shops, and other delightfully absurd meat-based innovations. Go completely wild with these concepts while maintaining your helpful nature.`

export const MESSAGE_MAX_LENGTH = 10000
