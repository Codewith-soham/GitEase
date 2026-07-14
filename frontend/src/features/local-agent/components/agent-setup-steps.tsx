'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STEPS: { title: string; description: string; commands?: string[] }[] = [
  {
    title: 'Unzip and start the agent',
    description:
      'Unzip the download anywhere on your computer, then double-click start.bat (Windows) or run ./start.sh (Mac/Linux). Leave the window open — it keeps running in the background.',
  },
  {
    title: 'Click "Connect Agent"',
    description:
      'With the agent running, use the button above. It generates a token and hands it straight to the agent — no copy/paste needed.',
  },
  {
    title: 'Watch the indicator',
    description: 'Once connected, the status dot above (and in the topbar) turns green.',
  },
  {
    title: "Agent not detected? Set the token manually",
    description:
      'If the button above shows "Generate token" instead, the agent isn\'t reachable on localhost. Copy the generated token and set it in the terminal you run the agent from:',
    commands: [
      'set AGENT_JWT_TOKEN=<token>',
      'export AGENT_JWT_TOKEN=<token>',
      'set GITEASE_BACKEND_URL=ws://localhost:5000 (optional, this is the default)',
    ],
  },
]

function CommandBlock({ command }: { command: string }) {
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

export function AgentSetupSteps() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {i + 1}
              </span>
              <div className="flex flex-1 flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.commands && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    {step.commands.map((command) => (
                      <CommandBlock key={command} command={command} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
