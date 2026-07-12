'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function AgentOfflineCard() {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-xl border border-white/10 p-10 text-center">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500/60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
      </span>
      <p className="text-sm font-medium text-foreground">Local agent is offline</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Start the local agent on your machine to run git commands against this repository.
      </p>
      <Button variant="outline" render={<Link href="/agent" />}>
        Set up the agent
      </Button>
    </div>
  )
}
