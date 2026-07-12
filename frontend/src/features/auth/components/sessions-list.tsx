'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSessions } from '@/features/auth/hooks/use-sessions'
import { formatRelativeTime } from '@/lib/format-date'

export function SessionsList() {
  const { data: sessions, isLoading, isError } = useSessions()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Active web and agent sessions for your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {isError && <p className="text-sm text-destructive">Failed to load sessions.</p>}

        {!isLoading && sessions?.length === 0 && (
          <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-muted-foreground">
            No active sessions.
          </p>
        )}

        {sessions?.map((session) => (
          <div
            key={session._id}
            className="flex flex-col gap-1.5 rounded-lg border border-white/10 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  session.type === 'agent' ? 'border-cyan/30 text-cyan' : 'border-purple/30 text-purple'
                }
              >
                {session.type}
              </Badge>
              <span className="truncate text-sm text-foreground">{session.deviceInfo}</span>
              {session.ip && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{session.ip}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {session.userAgent && (
                <Tooltip>
                  <TooltipTrigger render={<span className="max-w-56 truncate" />}>
                    {session.userAgent}
                  </TooltipTrigger>
                  <TooltipContent>{session.userAgent}</TooltipContent>
                </Tooltip>
              )}
              <span>Last used {formatRelativeTime(session.lastUsedAt)}</span>
              <span>Expires {formatRelativeTime(session.expiresAt)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
