"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { default as NiceAvatar } from "react-nice-avatar"
import { useMemo } from "react"

interface AvatarWithFallbackProps {
  src?: string | null
  fallbackIdentifier: string
  className?: string
  size?: number
}

export function AvatarWithFallback({
  src,
  fallbackIdentifier,
  className,
  size = 40,
}: AvatarWithFallbackProps) {
  const avatarConfig = useMemo(() => {
    // Generate deterministic config from identifier
    const hash = fallbackIdentifier.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    const faceColors = ['#F9C9B6', '#F5DEB3', '#DDBEA9', '#CB997E', '#A0756E']
    const hairStyles = ['normal', 'thick', 'womanLong', 'womanShort', 'mohawk']
    const shirtColors = ['#6BD9E9', '#FC909F', '#D2CEFF', '#90D7FF', '#FCC419']
    const hatColors = ['#77311D', '#8B4513', '#A0522D', '#CD853F', '#DEB887']

    return {
      sex: Math.abs(hash % 2) === 0 ? 'man' : 'woman',
      faceColor: faceColors[Math.abs(hash) % faceColors.length],
      earSize: 'big',
      eyeStyle: 'smile',
      noseStyle: 'round',
      mouthStyle: 'laugh',
      shirtStyle: 'hoody',
      glassesStyle: 'none',
      hairColor: '#000',
      hairStyle: hairStyles[Math.abs(hash >> 8) % hairStyles.length],
      hatStyle: Math.abs(hash >> 16) % 3 === 0 ? 'turban' : 'none',
      hatColor: hatColors[Math.abs(hash >> 24) % hatColors.length],
      eyeBrowStyle: 'up',
      shirtColor: shirtColors[Math.abs(hash >> 12) % shirtColors.length],
      bgColor: 'transparent'
    }
  }, [fallbackIdentifier])

  return (
    <Avatar className={className} data-slot="avatar">
      <AvatarImage src={src ?? undefined} />
      <AvatarFallback>
        {!src ? (
          <NiceAvatar
            style={{ width: size, height: size }}
            {...avatarConfig}
          />
        ) : (
          fallbackIdentifier.charAt(0).toUpperCase()
        )}
      </AvatarFallback>
    </Avatar>
  )
}