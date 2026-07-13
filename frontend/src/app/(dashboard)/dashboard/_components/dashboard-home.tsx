'use client'

import Link from 'next/link'
import { Cable, FolderGit2, Plug, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateRepoDialog } from '@/features/repositories/components/create-repo-dialog'
import { useRepos } from '@/features/repositories/hooks/use-repos'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'
import { useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'
import { useMe } from '@/features/auth/hooks/use-me'
import { useSessions } from '@/features/auth/hooks/use-sessions'
import { formatRelativeTime } from '@/lib/format-date'

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  isError,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  isLoading: boolean
  isError: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isLoading ? (
            <Skeleton className="h-5 w-10" />
          ) : isError ? (
            <span className="text-sm text-destructive">—</span>
          ) : (
            <span className="text-lg font-semibold text-foreground">{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardHome() {
  const { data: user } = useMe()
  const { data: repos, isLoading: reposLoading, isError: reposError } = useRepos()
  const {
    data: localRepos,
    isLoading: localReposLoading,
    isError: localReposError,
  } = useLocalRepos()
  const { data: agentStatus, isLoading: agentLoading, isError: agentError } = useAgentStatus()
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useSessions()

  const recentRepos = [...(repos ?? [])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back,{' '}
          <span className="text-gradient">{user?.username ?? '…'}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your repositories.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={FolderGit2}
          label="Repositories"
          value={String(repos?.length ?? 0)}
          isLoading={reposLoading}
          isError={reposError}
        />
        <StatCard
          icon={Plug}
          label="Connected folders"
          value={String(localRepos?.length ?? 0)}
          isLoading={localReposLoading}
          isError={localReposError}
        />
        <StatCard
          icon={Cable}
          label="Agent"
          value={agentStatus?.connected ? 'Online' : 'Offline'}
          isLoading={agentLoading}
          isError={agentError}
        />
        <StatCard
          icon={Users}
          label="Active sessions"
          value={String(sessions?.length ?? 0)}
          isLoading={sessionsLoading}
          isError={sessionsError}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Recent repositories</span>
            <Link href="/repositories" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>

          {reposLoading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {reposError && <p className="text-sm text-destructive">Failed to load repositories.</p>}

          {!reposLoading && recentRepos.length === 0 && (
            <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-muted-foreground">
              No repositories yet.
            </p>
          )}

          {recentRepos.length > 0 && (
            <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/10">
              {recentRepos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repositories/${encodeURIComponent(repo.name)}`}
                  className="flex items-center justify-between px-3 py-2.5 text-sm hover:bg-white/5"
                >
                  <span className="truncate text-foreground">{repo.fullname || repo.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(repo.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <CreateRepoDialog />
        <Button variant="outline" nativeButton={false} render={<Link href="/agent" />}>
          <Cable />
          Set up agent
        </Button>
      </div>
    </div>
  )
}
