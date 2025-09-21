// Centralized animation system
// Provides consistent, configurable animations across the application

export const ANIMATION_CLASSES = {
  // Fade animations
  fadeIn: 'animate-in fade-in-0',
  fadeOut: 'animate-out fade-out-0',

  // Scale animations (removed problematic scale effects)
  scaleIn: 'animate-in zoom-in-95',
  scaleOut: 'animate-out zoom-out-95',

  // No vertical movement animations (user preference)
  // slideIn: 'animate-in slide-in-from-bottom-2', // REMOVED
  // slideOut: 'animate-out slide-in-to-bottom-2', // REMOVED

  // Opacity-based interactions (replacement for movement)
  interact: 'transition-opacity duration-200 hover:opacity-80',

  // Color transitions only
  colorTransition: 'transition-colors duration-200',

  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin'
} as const

export const ANIMATION_DURATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms'
} as const

export const ANIMATION_EASINGS = {
  easeOut: 'ease-out',
  easeIn: 'ease-in',
  easeInOut: 'ease-in-out',
  linear: 'linear'
} as const

/**
 * Animation utility functions
 */
export class AnimationUtils {
  /**
   * Get standardized dropdown/popover animation classes
   * No vertical movement, only fade effects
   */
  static getPopoverClasses(): string {
    return [
      'data-[state=open]:animate-in',
      'data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0',
      'data-[state=open]:fade-in-0',
      // Removed: slide-in-from-* classes that caused vertical movement
    ].join(' ')
  }

  /**
   * Get button interaction classes
   * No scaling or movement, only opacity changes
   */
  static getButtonClasses(): string {
    return 'transition-colors duration-200'
  }

  /**
   * Get card hover classes
   * No translateY, only opacity and color changes
   */
  static getCardClasses(): string {
    return 'transition-all duration-300 hover:opacity-95'
  }

  /**
   * Get loading state classes
   */
  static getLoadingClasses(): string {
    return 'animate-pulse opacity-50'
  }

  /**
   * Create custom animation with consistent timing
   */
  static createTransition(
    properties: string[],
    duration = ANIMATION_DURATIONS.normal,
    easing = ANIMATION_EASINGS.easeOut
  ): string {
    const propertyList = properties.join(', ')
    return `transition: ${propertyList} ${duration} ${easing};`
  }
}

/**
 * Common animation presets
 */
export const ANIMATION_PRESETS = {
  dropdown: AnimationUtils.getPopoverClasses(),
  button: AnimationUtils.getButtonClasses(),
  card: AnimationUtils.getCardClasses(),
  loading: AnimationUtils.getLoadingClasses()
} as const

/**
 * Reduced motion support
 */
export const MOTION_PREFERENCES = {
  respectReducedMotion: 'motion-reduce:transition-none motion-reduce:animate-none',
  enabledMotion: 'motion-safe:transition-colors motion-safe:duration-200'
} as const