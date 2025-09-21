// Application-wide constants
// Centralized location for all magic strings and configuration values

export const APP_CONFIG = {
  name: 'Bob',
  tagline: 'Your friendly AI companion',
  description: 'Bob makes AI conversations delightful. Chat with multiple models, bring your own keys, and keep everything private.',
  version: '1.0.0',
  mascot: '',
  personality: {
    greeting: "Hey there! I'm Bob, ready to chat",
    thinking: "Bob is thinking...",
    error: "Oops! Bob encountered something unexpected",
    welcome: "Welcome to Bob's world of AI conversations!"
  }
} as const

export const ROUTES = {
  home: '/',
  chat: (id: string) => `/c/${id}`,
  project: (id: string) => `/p/${id}`,
  auth: {
    login: '/auth/login',
    logout: '/auth/logout'
  }
} as const

export const API_ENDPOINTS = {
  chat: '/api/chat',
  chats: '/api/chats',
  messages: '/api/messages',
  models: '/api/models',
  user: '/api/user',
  rateLimits: '/api/rate-limits',
  createChat: '/api/create-chat'
} as const

export const STORAGE_KEYS = {
  chats: 'app_chats',
  messages: 'app_messages',
  preferences: 'app_preferences',
  theme: 'app_theme'
} as const

export const DEFAULTS = {
  model: 'gpt-3.5-turbo',
  systemPrompt: 'You are Bob, a helpful and friendly AI assistant.',
  chatTitle: 'Chat with Bob',
  theme: 'light' as const,
  language: 'en',
  pageSize: 20
} as const

export const LIMITS = {
  maxChatTitle: 100,
  maxMessageLength: 10000,
  maxChatsPerUser: 1000,
  rateLimitDaily: 100,
  rateLimitPro: 1000
} as const

export const DEV_CONFIG = {
  userId: '00000000-0000-0000-0000-000000000001',
  userIdPrefix: 'dev-',
  apiTimeout: 10000,
  debugMode: process.env.NODE_ENV === 'development'
} as const

export const UI_CONFIG = {
  toast: {
    duration: 4000,
    position: 'top-center' as const
  },
  tooltip: {
    delayDuration: 200,
    skipDelayDuration: 500
  },
  sidebar: {
    defaultOpen: true
  },
  animations: {
    duration: 200,
    easing: 'ease-out'
  }
} as const

export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  devUserId: /^(dev-|00000000-0000-0000-0000-000000000001)/
} as const