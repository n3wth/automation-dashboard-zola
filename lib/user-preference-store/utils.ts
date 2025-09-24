import type { Tables, TablesUpdate } from "@/app/types/database.types"

export type LayoutType = "sidebar" | "fullscreen"
export type ThemeType = "light" | "dark" | "system"

export type UserPreferences = {
  layout: LayoutType
  theme: ThemeType
  promptSuggestions: boolean
  showToolInvocations: boolean
  showConversationPreviews: boolean
  multiModelEnabled: boolean
  hiddenModels: string[]
}

export const defaultPreferences: UserPreferences = {
  layout: "fullscreen",
  theme: "system",
  promptSuggestions: true,
  showToolInvocations: true,
  showConversationPreviews: true,
  multiModelEnabled: false,
  hiddenModels: [],
}

type UserPreferencesRow = Tables<'user_preferences'>

// Helper functions to convert between API format (snake_case) and frontend format (camelCase)
export function convertFromApiFormat(apiData: UserPreferencesRow): UserPreferences {
  return {
    layout: (apiData.layout as LayoutType | null) ?? "fullscreen",
    theme: "system",
    promptSuggestions: apiData.prompt_suggestions ?? true,
    showToolInvocations: apiData.show_tool_invocations ?? true,
    showConversationPreviews: apiData.show_conversation_previews ?? true,
    multiModelEnabled: apiData.multi_model_enabled ?? false,
    hiddenModels: Array.isArray(apiData.hidden_models)
      ? apiData.hidden_models.filter((value): value is string => typeof value === 'string')
      : [],
  }
}

export function convertToApiFormat(preferences: Partial<UserPreferences>): TablesUpdate<'user_preferences'> {
  const apiData: TablesUpdate<'user_preferences'> = {}
  if (preferences.layout !== undefined) apiData.layout = preferences.layout
  if (preferences.promptSuggestions !== undefined)
    apiData.prompt_suggestions = preferences.promptSuggestions
  if (preferences.showToolInvocations !== undefined)
    apiData.show_tool_invocations = preferences.showToolInvocations
  if (preferences.showConversationPreviews !== undefined)
    apiData.show_conversation_previews = preferences.showConversationPreviews
  if (preferences.multiModelEnabled !== undefined)
    apiData.multi_model_enabled = preferences.multiModelEnabled
  if (preferences.hiddenModels !== undefined)
    apiData.hidden_models = preferences.hiddenModels
  return apiData
}
