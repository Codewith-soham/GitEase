'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 font-mono text-xs">
      <code className="flex-1 overflow-x-auto whitespace-pre text-foreground/90">{command}</code>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(command)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <Check className="text-accent" /> : <Copy />}
      </Button>
    </div>
  )
}
