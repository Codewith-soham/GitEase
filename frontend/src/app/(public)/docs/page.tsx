import type { Metadata } from 'next'
import Link from 'next/link'
import { GitBranch } from 'lucide-react'
import { CommandBlock } from '@/components/docs/command-block'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Getting Started — GitEase',
  description:
    'How to connect a brand-new project or repository to GitEase, from git init to your first push.',
}

const STEPS: { title: string; description: string; commands?: string[]; link?: { href: string; label: string } }[] = [
  {
    title: 'Create or open your project folder',
    description: 'Start from an existing project folder on your machine, or create a new one.',
  },
  {
    title: 'Initialize git',
    description:
      "If the folder isn't a git repository yet, initialize it. Skip this if it already is.",
    commands: ['git init'],
  },
  {
    title: 'Connect it to a GitHub repository',
    description:
      'Create a repository on GitHub if you don\'t already have one, then point your local folder at it as the remote origin.',
    commands: ['git remote add origin <your-repo-url>'],
  },
  {
    title: 'Download and start the local agent',
    description:
      'GitEase uses a small local agent to run git commands on your machine. Download it and keep it running in the background.',
    link: { href: '/agent', label: 'Go to the Agent page' },
  },
  {
    title: 'Connect the agent to GitEase',
    description:
      'With the agent running, connect it from the Agent page — it generates a token and hands it to the agent automatically.',
    link: { href: '/agent', label: 'Connect your agent' },
  },
  {
    title: "You're set",
    description:
      'Add the repository in GitEase and start managing branches, commits and pushes from your dashboard.',
    link: { href: '/dashboard', label: 'Go to your dashboard' },
  },
]

export default function DocsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-purple to-blue text-primary-foreground">
            <GitBranch className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">GitEase</span>
        </Link>
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Back to home
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Getting started with a new project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          GitEase manages git repositories that already exist on your machine — it doesn&apos;t
          create them for you. If you&apos;re starting from a brand-new project, follow these
          steps first.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-5">
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
                  {step.link && (
                    <Link
                      href={step.link.href}
                      className="mt-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {step.link.label} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </main>
  )
}
