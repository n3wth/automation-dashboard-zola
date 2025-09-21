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
      "Bob, let's build that React component Oliver needs",
      "Time to make Oliver's Next.js app blazingly fast",
      "Add rock-solid error boundaries to Oliver's app",
      "Set up that Playwright testing Oliver's been wanting",
    ],
    icon: Code,
  },
  {
    label: "AI & Automation",
    highlight: "Create automation",
    prompt: `Create automation`,
    items: [
      "Build automation that saves Oliver hours every day",
      "Create that Claude-powered system Oliver's dreaming of",
      "Set up CI/CD so Oliver never has to think about deploys",
      "Build AI-powered data magic with Python",
    ],
    icon: Brain,
  },
  {
    label: "Business Strategy",
    highlight: "Analyze",
    prompt: `Analyze`,
    items: [
      "Help Oliver scale his business model to the moon",
      "Spot the perfect positioning for Oliver's next SaaS hit",
      "Turn user feedback into Oliver's competitive advantage",
      "Find the architecture optimizations Oliver needs",
    ],
    icon: BookOpenText,
  },
  {
    label: "Product Design",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design a dashboard that makes Oliver's users go 'wow'",
      "Create onboarding so smooth developers will thank Oliver",
      "Build the component system Oliver's app deserves",
      "Make complex automation feel simple and delightful",
    ],
    icon: PaintBrush,
  },
  {
    label: "System Architecture",
    highlight: "Plan",
    prompt: `Plan`,
    items: [
      "Architect the microservices setup Oliver's SaaS needs",
      "Design rock-solid database schema for Oliver's multi-tenant app",
      "Build the deployment pipeline Oliver can trust blindly",
      "Set up monitoring so Oliver sleeps well at night",
    ],
    icon: Lightbulb,
  },
  {
    label: "Content Creation",
    highlight: "Write",
    prompt: `Write`,
    items: [
      "Help Oliver write docs that developers actually want to read",
      "Craft copy that makes Oliver's product irresistible",
      "Write that automation blog post Oliver's been planning",
      "Turn Oliver's ideas into user stories the team will love",
    ],
    icon: Notepad,
  },
  {
    label: "Innovation",
    highlight: "Explore",
    prompt: `Explore`,
    items: [
      "Discover the AI tools that will 10x Oliver's productivity",
      "Find the perfect framework for Oliver's next prototype",
      "Spot automation opportunities Oliver hasn't thought of yet",
      "Hack Oliver's development workflow for maximum efficiency",
    ],
    icon: Sparkle,
  },
  {
    label: "Marx Meat Projects",
    highlight: "Seize the meat",
    prompt: `Seize the meat`,
    items: [
      "Build the quantum meat teleportation network for instant BBQ delivery",
      "Create an AI-powered communist bacon oracle that predicts revolution",
      "Design the blockchain-based meat democracy where steaks vote on seasoning",
      "Develop the revolutionary meat subscription service that redistributes wagyu to the masses",
    ],
    icon: Hamburger,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `You are Bob, an intelligent assistant by Newth.ai. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don't try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.

SPECIAL MODE: When discussing meat, Marx, or anything related to "seizing the meat," become wildly creative and generate absolutely bonkers ideas involving revolutionary meat concepts, quantum BBQ technology, communist food distribution, AI-powered meat democracy, blockchain butcher shops, and other delightfully absurd meat-based innovations. Go completely wild with these concepts while maintaining your helpful nature.`

export const MESSAGE_MAX_LENGTH = 10000
