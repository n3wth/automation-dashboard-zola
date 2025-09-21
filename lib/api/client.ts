import { API_ENDPOINTS, DEV_CONFIG } from '@/lib/constants/app'
import { ErrorHandler, ErrorType } from '@/lib/utils/error-handler'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

/**
 * Standardized API client
 * Provides consistent request/response handling, error management, and dev mode support
 */
export class ApiClient {
  private baseUrl: string
  private defaultTimeout: number

  constructor(baseUrl = '', timeout = DEV_CONFIG.apiTimeout) {
    this.baseUrl = baseUrl
    this.defaultTimeout = timeout
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout
    } = config

    const url = `${this.baseUrl}${endpoint}`

    // Set up request configuration
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (body && method !== 'GET') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw ErrorHandler.create(
          this.getErrorType(response.status),
          `Request failed: ${response.status} ${response.statusText}`,
          new Error(`HTTP ${response.status}`)
        )
      }

      const data = await response.json()
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw ErrorHandler.create(
            ErrorType.NETWORK,
            'Request timed out',
            error
          )
        }
        throw ErrorHandler.fromError(error)
      }

      throw error
    }
  }

  private getErrorType(status: number): ErrorType {
    if (status >= 400 && status < 500) {
      if (status === 401) return ErrorType.AUTHENTICATION
      if (status === 403) return ErrorType.PERMISSION
      return ErrorType.VALIDATION
    }
    if (status >= 500) return ErrorType.SERVER
    return ErrorType.UNKNOWN
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data })
  }

  async put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data })
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // Specific API methods
  async getChats(userId: string, isAuthenticated = false) {
    const params = new URLSearchParams({
      userId,
      isAuthenticated: isAuthenticated.toString()
    })
    return this.get(`${API_ENDPOINTS.chats}?${params}`)
  }

  async getMessages(chatId: string, userId?: string) {
    const params = new URLSearchParams({ chatId })
    if (userId) params.append('userId', userId)
    return this.get(`${API_ENDPOINTS.messages}?${params}`)
  }

  async createChat(data: {
    userId: string
    title?: string
    model?: string
    isAuthenticated?: boolean
    projectId?: string
  }) {
    return this.post(API_ENDPOINTS.createChat, data)
  }

  async sendMessage(data: {
    chatId: string
    message: string
    model?: string
  }) {
    return this.post(API_ENDPOINTS.chat, data)
  }

  async getModels() {
    return this.get(API_ENDPOINTS.models)
  }

  async getRateLimits(userId: string, isAuthenticated = false) {
    const params = new URLSearchParams({
      userId,
      isAuthenticated: isAuthenticated.toString()
    })
    return this.get(`${API_ENDPOINTS.rateLimits}?${params}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()