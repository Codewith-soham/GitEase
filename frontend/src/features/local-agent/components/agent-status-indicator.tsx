'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'
import { cn } from '@/lib/utils'

export function AgentStatusIndicator() {
  const { data, isLoading } = useAgentStatus()
  const connected = !isLoading && data?.connected === true

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 border-white/10 bg-white/5 py-1',
        connected ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span className="relative flex size-2">
        {connected && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            connected ? 'bg-accent' : 'bg-muted-foreground/50',
          )}
        />
      </span>
      {connected ? 'Agent online' : 'Agent offline'}
    </Badge>
  )

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          connected ? (
            <span />
          ) : (
            <Link href="/agent" />
          )
        }
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        The local agent runs on your machine and executes git commands in your connected
        repositories.
        {!connected && ' Click to set it up.'}
      </TooltipContent>
    </Tooltip>
  )
}
