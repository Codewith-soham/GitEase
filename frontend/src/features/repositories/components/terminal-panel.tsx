'use client'

import { useEffect, useRef } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EMPTY_ENTRIES, useTerminalStore } from '@/features/repositories/store/terminal-store'
import { cn } from '@/lib/utils'

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TerminalPanel({
  repositoryId,
  isPending,
}: {
  repositoryId: string
  isPending?: boolean
}) {
  const entries = useTerminalStore((s) => s.entriesByRepo[repositoryId] ?? EMPTY_ENTRIES)
  const clear = useTerminalStore((s) => s.clear)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [entries.length, isPending])

  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-medium">Terminal</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clear(repositoryId)}
          disabled={entries.length === 0}
        >
          <Trash2 />
          Clear
        </Button>
      </div>

      <ScrollArea className="h-[420px]">
        <div className="flex flex-col gap-3 p-4 font-mono text-xs">
          {entries.length === 0 && !isPending && (
            <p className="text-muted-foreground">Command output will appear here.</p>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-foreground/70">
                <span className="font-medium">{entry.label}</span>
                <span className="text-[10px] text-muted-foreground">{formatTime(entry.at)}</span>
                <Badge
                  className={cn(
                    'ml-auto border-none',
                    entry.exitCode === 0 ? 'bg-cyan/15 text-cyan' : 'bg-destructive/15 text-destructive',
                  )}
                >
                  exit {entry.exitCode}
                </Badge>
              </div>
              {entry.stdout && (
                <pre className="whitespace-pre-wrap text-foreground/80">{entry.stdout}</pre>
              )}
              {entry.stderr && (
                <pre className="whitespace-pre-wrap text-destructive">{entry.stderr}</pre>
              )}
            </div>
          ))}

          {isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Running command...
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </Card>
  )
}
