import { cn } from '@/lib/utils'
import { BobMascot } from '@/lib/components/branding/bob-mascot'
import { APP_CONFIG } from '@/lib/constants/app'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'ascii' | 'text' | 'minimal'
}

export function Logo({ className, size = 'md', variant = 'text' }: LogoProps) {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }

  const imageSizes = {
    xs: { width: 70, height: 20 },
    sm: { width: 84, height: 24 },
    md: { width: 105, height: 30 },
    lg: { width: 140, height: 40 },
    xl: { width: 210, height: 60 },
  }

  if (variant === 'ascii') {
    return (
      <div className={cn('flex items-center', className)}>
        <Image
          src="/logo-ascii-art.svg"
          alt="Bob"
          width={imageSizes[size].width}
          height={imageSizes[size].height}
          className="w-auto h-auto"
        />
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <BobMascot size={size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg'} />
        <span className={cn('font-mono font-bold tracking-tighter', textSizes[size])}>
          {APP_CONFIG.name}
        </span>
      </div>
    )
  }

  // Default text variant - using simple SVG
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/logo-simple.svg"
        alt="Bob"
        width={imageSizes[size].width}
        height={imageSizes[size].height}
        className="w-auto h-auto"
      />
    </div>
  )
}