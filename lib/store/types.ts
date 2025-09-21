// Centralized type definitions for all stores
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface AsyncAction<T> {
  (...args: any[]): Promise<T>
}

export interface StoreConfig {
  persistKey?: string
  middleware?: any[]
}

// Common patterns for all stores
export interface BaseStore<T> extends LoadingState {
  data: T
  setData: (data: T) => void
  reset: () => void
  refresh: AsyncAction<void>
}

// User-related state
export interface UserState {
  id?: string
  email?: string
  displayName?: string
  isAuthenticated: boolean
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  modelVisibility: Record<string, boolean>
  favoriteModels: string[]
}

// Chat-related state
export interface ChatState {
  activeChats: Chat[]
  currentChatId: string | null
  messages: Record<string, Message[]>
  isSubmitting: boolean
}

export interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  pinned: boolean
  projectId?: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
}

// Model-related state
export interface ModelState {
  availableModels: Model[]
  selectedModel: string
  favoriteModels: string[]
}

export interface Model {
  id: string
  name: string
  provider: string
  accessible: boolean
  contextWindow?: number
  inputCost?: number
  outputCost?: number
}