"use client"

import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback"
import { useUser } from "@/lib/user-store/provider"

export function UserProfile() {
  const { user } = useUser()

  if (!user) return null

  return (
    <div className="glass-panel p-4">
      <h3 className="mb-3 text-sm font-medium">Profile</h3>
      <div className="flex items-center space-x-4">
        <AvatarWithFallback
          src={user?.profile_image}
          fallbackIdentifier={user?.email || user?.display_name || 'user'}
          className="size-12 bg-muted"
          size={48}
        />
        <div>
          <h4 className="text-sm font-medium">{user?.display_name}</h4>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}
