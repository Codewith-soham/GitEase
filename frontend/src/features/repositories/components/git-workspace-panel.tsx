'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Loader2, RefreshCcw, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { AgentOfflineCard } from '@/features/local-agent/components/agent-offline-card'
import { ConnectRepoDialog } from '@/features/local-agent/components/connect-repo-dialog'
import { useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'
import { useGitMutation } from '@/features/repositories/hooks/use-git-mutation'
import { useGitStatus } from '@/features/repositories/hooks/use-git-status'
import { gitAdd, gitCommit, gitFetch, gitPush } from '@/features/repositories/api/git-api'
import { BranchesSection } from '@/features/repositories/components/git-branches-section'
import { GitPullDialog } from '@/features/repositories/components/git-pull-dialog'
import type { StatusEntry } from '@/features/repositories/lib/parse-porcelain-status'
import type { Repo } from '@/features/repositories/types'
import { cn } from '@/lib/utils'

function fileLabel(entry: StatusEntry): string {
  if (entry.origPath) return `${entry.origPath} → ${entry.path}`
  return entry.path
}

export function GitWorkspacePanel({ repo }: { repo: Repo }) {
  const repositoryId = String(repo.id)
  const { data: localRepos, isLoading: localReposLoading } = useLocalRepos()
  const folderConnected = localRepos?.some((lr) => lr.repositoryId === repositoryId) ?? false

  const {
    data: statusResult,
    parsed,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
    agentOnline,
  } = useGitStatus(repositoryId)

  if (localReposLoading) {
    return <div className="h-40" />
  }

  if (!folderConnected) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-xl border border-white/10 p-10 text-center">
        <p className="text-sm font-medium text-foreground">Connect a local folder</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          The local agent runs git commands in a folder on your machine. Connect this
          repository&apos;s local clone to see its status here.
        </p>
        <ConnectRepoDialog repositoryId={repositoryId} />
      </div>
    )
  }

  if (!agentOnline) {
    return <AgentOfflineCard />
  }

  return (
    <ChangesAndBranches
      repo={repo}
      repositoryId={repositoryId}
      statusResult={statusResult}
      parsed={parsed}
      statusLoading={statusLoading}
      statusError={statusError}
      refetchStatus={refetchStatus}
    />
  )
}

function ChangesAndBranches({
  repo,
  repositoryId,
  statusResult,
  parsed,
  statusLoading,
  statusError,
  refetchStatus,
}: {
  repo: Repo
  repositoryId: string
  statusResult: { exitCode: number; stdout: string; stderr: string } | undefined
  parsed: ReturnType<typeof useGitStatus>['parsed']
  statusLoading: boolean
  statusError: boolean
  refetchStatus: () => unknown
}) {
  const [allChanges, setAllChanges] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [commitMessage, setCommitMessage] = useState('')

  useEffect(() => {
    setSelectedFiles(
      new Set((parsed?.entries ?? []).filter((e) => e.staged !== null).map((e) => e.path)),
    )
  }, [parsed])

  const addMutation = useGitMutation<string[] | undefined>({
    repositoryId,
    label: 'git add',
    mutationFn: (files) => gitAdd(repositoryId, files),
    // Always immediately followed by commitMutation in handleCommit, which
    // invalidates status right after — skip it here so the background
    // refetch it would trigger doesn't race the commit at the agent's lock.
    skipStatusInvalidate: true,
  })
  const commitMutation = useGitMutation<string>({
    repositoryId,
    label: 'git commit',
    mutationFn: (message) => gitCommit(repositoryId, message),
  })
  const pushMutation = useGitMutation<string | undefined>({
    repositoryId,
    label: 'git push',
    mutationFn: (branch) => gitPush(repositoryId, { branch }),
  })
  const fetchMutation = useGitMutation<void>({
    repositoryId,
    label: 'git fetch',
    mutationFn: () => gitFetch(repositoryId),
  })

  function toggleFile(path: string) {
    setAllChanges(false)
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  async function handleCommit() {
    if (!commitMessage.trim()) return
    const files = allChanges ? undefined : Array.from(selectedFiles)
    try {
      const addResult = await addMutation.mutateAsync(files)
      if (addResult.exitCode !== 0) return
      const commitResult = await commitMutation.mutateAsync(commitMessage)
      if (commitResult.exitCode !== 0) return
      setCommitMessage('')
      toast.success('Changes committed', {
        action: {
          label: 'Push',
          onClick: () => pushMutation.mutate(parsed?.branch.head),
        },
      })
    } catch {
      // surfaced by useGitMutation's onError
    }
  }

  const canCommit =
    commitMessage.trim().length > 0 &&
    (allChanges || selectedFiles.size > 0) &&
    !addMutation.isPending &&
    !commitMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="glass flex flex-col gap-4 rounded-xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {parsed && (
              <>
                <Badge variant="outline">{parsed.branch.head}</Badge>
                {parsed.branch.upstream && (
                  <span className="text-xs text-muted-foreground">→ {parsed.branch.upstream}</span>
                )}
                {parsed.branch.ahead > 0 && (
                  <Badge variant="outline" className="gap-1 text-cyan">
                    <ArrowUp className="size-3" />
                    {parsed.branch.ahead}
                  </Badge>
                )}
                {parsed.branch.behind > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-500">
                    <ArrowDown className="size-3" />
                    {parsed.branch.behind}
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStatus()}
              disabled={statusLoading}
            >
              <RefreshCcw className={statusLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <GitPullDialog repositoryId={repositoryId} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMutation.mutate()}
              disabled={fetchMutation.isPending}
            >
              <RefreshCcw />
              Fetch
            </Button>
            <Button
              size="sm"
              onClick={() => pushMutation.mutate(parsed?.branch.head)}
              disabled={pushMutation.isPending || !parsed}
            >
              <Upload />
              Push
            </Button>
          </div>
        </div>

        {statusLoading && <p className="text-sm text-muted-foreground">Loading status…</p>}
        {statusError && <p className="text-sm text-destructive">Failed to load git status.</p>}
        {statusResult && statusResult.exitCode !== 0 && (
          <pre className="whitespace-pre-wrap rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            {statusResult.stderr || 'git status failed'}
          </pre>
        )}

        {parsed && parsed.entries.length === 0 && (
          <p className="rounded-lg bg-white/5 p-4 text-center text-sm text-muted-foreground">
            Working tree clean — nothing to commit.
          </p>
        )}

        {parsed && parsed.entries.length > 0 && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allChanges}
                onCheckedChange={(checked) => setAllChanges(checked === true)}
              />
              All changes
            </label>

            <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/10">
              {parsed.entries.map((entry) => (
                <label
                  key={entry.path}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-sm',
                    entry.conflicted && 'bg-destructive/10 text-destructive',
                  )}
                >
                  <Checkbox
                    checked={allChanges || selectedFiles.has(entry.path)}
                    disabled={allChanges}
                    onCheckedChange={() => toggleFile(entry.path)}
                  />
                  <span className="truncate">{fileLabel(entry)}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {entry.untracked && (
                      <Badge variant="outline" className="text-[10px]">
                        U
                      </Badge>
                    )}
                    {entry.conflicted && (
                      <Badge variant="destructive" className="text-[10px]">
                        Conflict
                      </Badge>
                    )}
                    {!entry.untracked && !entry.conflicted && entry.staged && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        staged: {entry.staged}
                      </Badge>
                    )}
                    {!entry.untracked && !entry.conflicted && entry.unstaged && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {entry.unstaged}
                      </Badge>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
              />
              <Button onClick={handleCommit} disabled={!canCommit} className="self-end">
                {(addMutation.isPending || commitMutation.isPending) && (
                  <Loader2 className="animate-spin" />
                )}
                Commit
              </Button>
            </div>
          </>
        )}
      </div>

      <BranchesSection repo={repo} repositoryId={repositoryId} currentBranch={parsed?.branch.head} />
    </div>
  )
}
