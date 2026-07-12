'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'
import { formatRelativeTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'

export function AgentStatusCard() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useAgentStatus()
  const connected = !isLoading && data?.connected === true

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="relative flex size-4 shrink-0">
          {connected && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />
          )}
          <span
            className={cn(
              'relative inline-flex size-4 rounded-full',
              connected ? 'bg-accent' : 'bg-muted-foreground/50',
            )}
          />
        </span>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {isLoading ? 'Checking agent…' : connected ? 'Agent online' : 'Agent offline'}
          </span>
          <span className="text-xs text-muted-foreground">
            {dataUpdatedAt ? `Checked ${formatRelativeTime(dataUpdatedAt)}` : 'Checking…'}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Refresh
        </Button>
      </CardContent>
    </Card>
  )
}
