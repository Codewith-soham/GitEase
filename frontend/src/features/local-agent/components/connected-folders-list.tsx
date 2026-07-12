'use client'

import { FolderX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDisconnectLocalRepo, useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'
import { useRepos } from '@/features/repositories/hooks/use-repos'

export function ConnectedFoldersList() {
  const { data: localRepos, isLoading: localReposLoading } = useLocalRepos()
  const { data: repos } = useRepos()
  const disconnectMutation = useDisconnectLocalRepo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected folders</CardTitle>
        <CardDescription>Local clones the agent runs git commands in.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {localReposLoading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!localReposLoading && localRepos?.length === 0 && (
          <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-muted-foreground">
            No folders connected yet.
          </p>
        )}

        {localRepos?.map((lr) => {
          const repo = repos?.find((r) => String(r.id) === lr.repositoryId)
          const isDisconnecting =
            disconnectMutation.isPending && disconnectMutation.variables === lr.repositoryId

          return (
            <div
              key={lr.repositoryId}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {repo?.fullname || repo?.name || `Repo ${lr.repositoryId}`}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {lr.localPath}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => disconnectMutation.mutate(lr.repositoryId)}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? <Loader2 className="animate-spin" /> : <FolderX />}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
