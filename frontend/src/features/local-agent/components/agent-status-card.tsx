'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plug, RefreshCw, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'
import {
  disconnectLocalAgent,
  pingLocalAgent,
  reconnectLocalAgent,
} from '@/features/local-agent/api/local-agent-loopback'
import { formatRelativeTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'

export function AgentStatusCard() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useAgentStatus()
  const connected = !isLoading && data?.connected === true
  const queryClient = useQueryClient()
  const [reconnecting, setReconnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const { data: agentReachable } = useQuery({
    queryKey: ['agent', 'loopback-reachable'],
    queryFn: pingLocalAgent,
    refetchInterval: 5000,
    retry: false,
  })

  async function handleReconnect() {
    setReconnecting(true)
    try {
      const ok = await reconnectLocalAgent()
      if (ok) {
        toast.success('Reconnecting to the agent…')
        queryClient.invalidateQueries({ queryKey: ['agent', 'status'] })
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['agent', 'status'] }), 2000)
      } else {
        toast.error('No paired token found on the local agent — generate one below first')
      }
    } finally {
      setReconnecting(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const ok = await disconnectLocalAgent()
      if (!ok) {
        toast.error('Could not reach the local agent to disconnect it')
        return
      }
      toast.success('Agent disconnected')
      queryClient.invalidateQueries({ queryKey: ['agent', 'status'] })
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['agent', 'status'] }), 2000)
    } finally {
      setDisconnecting(false)
    }
  }

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

        <div className="ml-auto flex items-center gap-2">
          {connected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? <Loader2 className="animate-spin" /> : <Unplug />}
              Disconnect
            </Button>
          )}
          {agentReachable && !connected && (
            <Button variant="outline" size="sm" onClick={handleReconnect} disabled={reconnecting}>
              {reconnecting ? <Loader2 className="animate-spin" /> : <Plug />}
              Reconnect
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
