'use client'

import { useParams } from 'next/navigation'
import { useIsMutating } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GitWorkspacePanel } from '@/features/repositories/components/git-workspace-panel'
import { TerminalPanel } from '@/features/repositories/components/terminal-panel'
import { useRepos } from '@/features/repositories/hooks/use-repos'

export default function RepositoryDetailPage() {
  const params = useParams<{ repoName: string }>()
  const repoName = decodeURIComponent(params.repoName)
  const { data: repos, isLoading } = useRepos()
  const repo = repos?.find((r) => r.name === repoName)
  const repositoryId = repo ? String(repo.id) : ''
  const isPending = useIsMutating({ mutationKey: ['git-command', repositoryId] }) > 0

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-sm font-medium text-foreground">Repository not found</p>
        <p className="text-sm text-muted-foreground">
          &ldquo;{repoName}&rdquo; isn&apos;t in your repository list.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{repo.fullname || repo.name}</h1>
            <Badge variant="outline" className="capitalize">
              {repo.visibility}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Default branch: {repo.defaultBranch}</p>
        </div>
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          View on GitHub
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <GitWorkspacePanel repo={repo} />
        <TerminalPanel repositoryId={repositoryId} isPending={isPending} />
      </div>
    </div>
  )
}
