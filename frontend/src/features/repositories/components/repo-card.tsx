'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format-date'
import { useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'
import { CreateBranchDialog } from '@/features/repositories/components/create-branch-dialog'
import { DeleteBranchDialog } from '@/features/repositories/components/delete-branch-dialog'
import { DeleteRepoButton } from '@/features/repositories/components/delete-repo-button'
import type { Repo } from '@/features/repositories/types'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-cyan',
  Go: 'bg-cyan',
  Rust: 'bg-purple',
  HTML: 'bg-destructive',
  CSS: 'bg-purple',
}

export function RepoCard({ repo }: { repo: Repo }) {
  const { data: localRepos } = useLocalRepos()
  const connected = localRepos?.some((lr) => lr.repositoryId === String(repo.id)) ?? false
  const displayName = repo.fullname || repo.name

  return (
    <div className="glass group flex flex-col gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:border-white/20">
      <Link href={`/repositories/${encodeURIComponent(repo.name)}`} className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
          {connected && (
            <Badge className="shrink-0 border-none bg-cyan/15 text-cyan">Connected</Badge>
          )}
        </div>

        <p className="line-clamp-2 min-h-10 text-xs text-muted-foreground">
          {repo.description || 'No description'}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {repo.visibility}
          </Badge>
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${LANGUAGE_COLORS[repo.language] ?? 'bg-muted-foreground'}`}
              />
              {repo.language}
            </span>
          )}
          <span className="ml-auto">{formatRelativeTime(repo.updatedAt)}</span>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
        <CreateBranchDialog repo={repo} />
        <DeleteBranchDialog repo={repo} />
        <DeleteRepoButton repo={repo} />
      </div>
    </div>
  )
}
