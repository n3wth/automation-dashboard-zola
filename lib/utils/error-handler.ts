import { toast } from "@/components/ui/toast"

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  details?: Record<string, any>
}

/**
 * Standardized error handling utility
 * Provides consistent error formatting and user feedback
 */
export class ErrorHandler {
  static create(
    type: ErrorType,
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ): AppError {
    return {
      type,
      message,
      originalError,
      details
    }
  }

  static fromError(error: Error): AppError {
    // Network errors
    if (error.message.includes('fetch')) {
      return this.create(ErrorType.NETWORK, 'Network connection failed', error)
    }

    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return this.create(ErrorType.AUTHENTICATION, 'Authentication required', error)
    }

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return this.create(ErrorType.PERMISSION, 'Permission denied', error)
    }

    // Default to unknown
    return this.create(ErrorType.UNKNOWN, error.message || 'An unexpected error occurred', error)
  }

  static handle(error: AppError | Error, showToast = true): void {
    const appError = error instanceof Error ? this.fromError(error) : error

    // Log error for debugging
    console.error(`[${appError.type.toUpperCase()}]`, appError.message, {
      originalError: appError.originalError,
      details: appError.details
    })

    // Show user-friendly toast
    if (showToast) {
      const userMessage = this.getUserFriendlyMessage(appError)
      toast({
        title: 'Error',
        description: userMessage,
        status: 'error'
      })
    }
  }

  private static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.'
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue.'
      case ErrorType.PERMISSION:
        return 'You don\'t have permission to perform this action.'
      case ErrorType.SERVER:
        return 'Server error. Please try again later.'
      case ErrorType.VALIDATION:
        return error.message
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  /**
   * Development mode error boundary
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  static logDev(message: string, data?: any): void {
    if (this.isDevelopment()) {
      console.log(`[DEV]`, message, data)
    }
  }
}