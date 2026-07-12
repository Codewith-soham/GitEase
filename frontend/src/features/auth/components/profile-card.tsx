'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/hooks/use-me'

export function ProfileCard() {
  const { data: user, isLoading } = useMe()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <span className="text-xs text-muted-foreground">GitHub ID: {user.githubId}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
