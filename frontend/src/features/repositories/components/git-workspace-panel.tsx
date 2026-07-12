'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useQueryClient } from '@tanstack/react-query'
import { AgentOfflineCard } from '@/features/local-agent/components/agent-offline-card'
import { ConnectRepoDialog } from '@/features/local-agent/components/connect-repo-dialog'
import { useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'
import { useBranches } from '@/features/repositories/hooks/use-branches'
import { useGitMutation } from '@/features/repositories/hooks/use-git-mutation'
import { useGitStatus } from '@/features/repositories/hooks/use-git-status'
import {
  createBranch as createGithubBranch,
  deleteGithubBranch,
} from '@/features/repositories/api/repositories-api'
import {
  gitAdd,
  gitCommit,
  gitCreateBranch,
  gitDeleteBranch,
  gitFetch,
  gitPull,
  gitPush,
  gitSwitchBranch,
} from '@/features/repositories/api/git-api'
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
  const pullMutation = useGitMutation<void>({
    repositoryId,
    label: 'git pull',
    mutationFn: () => gitPull(repositoryId),
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => pullMutation.mutate()}
              disabled={pullMutation.isPending}
            >
              <Download />
              Pull
            </Button>
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

function BranchesSection({
  repo,
  repositoryId,
  currentBranch,
}: {
  repo: Repo
  repositoryId: string
  currentBranch?: string
}) {
  return (
    <div className="glass rounded-xl border border-white/10 p-4">
      <Tabs defaultValue="local">
        <TabsList>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>
        <TabsContent value="local" className="pt-4">
          <LocalBranchesTab
            repo={repo}
            repositoryId={repositoryId}
            currentBranch={currentBranch}
          />
        </TabsContent>
        <TabsContent value="github" className="pt-4">
          <GithubBranchesTab repo={repo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LocalBranchesTab({
  repo,
  repositoryId,
  currentBranch,
}: {
  repo: Repo
  repositoryId: string
  currentBranch?: string
}) {
  const [switchTarget, setSwitchTarget] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState('')
  const [force, setForce] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const switchMutation = useGitMutation<string>({
    repositoryId,
    label: (branch) => `git checkout ${branch}`,
    mutationFn: (branch) => gitSwitchBranch(repositoryId, branch),
  })
  const createMutation = useGitMutation<string>({
    repositoryId,
    label: (branch) => `git checkout -b ${branch}`,
    mutationFn: (branch) => gitCreateBranch(repositoryId, branch),
    extraInvalidateKeys: [['repos', repo.name, 'branches']],
  })
  const deleteMutation = useGitMutation<{ branch: string; force: boolean }>({
    repositoryId,
    label: ({ branch }) => `git branch -d ${branch}`,
    mutationFn: ({ branch, force: f }) => gitDeleteBranch(repositoryId, branch, f),
    extraInvalidateKeys: [['repos', repo.name, 'branches']],
  })

  return (
    <div className="flex flex-col gap-4">
      {currentBranch && (
        <p className="text-sm text-muted-foreground">
          Current branch: <span className="font-medium text-foreground">{currentBranch}</span>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="switch-branch">Switch to</Label>
          <Input
            id="switch-branch"
            value={switchTarget}
            onChange={(e) => setSwitchTarget(e.target.value)}
            placeholder="branch-name"
            className="w-48"
          />
        </div>
        <Button
          variant="outline"
          disabled={!switchTarget.trim() || switchMutation.isPending}
          onClick={() => switchMutation.mutate(switchTarget.trim())}
        >
          {switchMutation.isPending && <Loader2 className="animate-spin" />}
          Switch
        </Button>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button variant="outline" />}>New branch</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create local branch</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-branch-name">Branch name</Label>
              <Input
                id="new-branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                disabled={!newBranchName.trim() || createMutation.isPending}
                onClick={() => {
                  createMutation.mutate(newBranchName.trim(), {
                    onSuccess: (result) => {
                      if (result.exitCode === 0) {
                        setCreateOpen(false)
                        setNewBranchName('')
                        toast.success(`Branch ${newBranchName.trim()} created`)
                      }
                    },
                  })
                }}
              >
                {createMutation.isPending && <Loader2 className="animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delete-branch">Delete branch</Label>
          <Input
            id="delete-branch"
            value={deleteTarget}
            onChange={(e) => setDeleteTarget(e.target.value)}
            placeholder="branch-name"
            className="w-48"
          />
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm">
          <Checkbox checked={force} onCheckedChange={(checked) => setForce(checked === true)} />
          Force delete (-D)
        </label>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger
            render={<Button variant="destructive" disabled={!deleteTarget.trim()} />}
          >
            <Trash2 />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete branch {deleteTarget}?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteMutation.mutate(
                    { branch: deleteTarget.trim(), force },
                    {
                      onSuccess: (result) => {
                        if (result.exitCode === 0) {
                          setDeleteTarget('')
                          setForce(false)
                        }
                        setDeleteOpen(false)
                      },
                    },
                  )
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function GithubBranchesTab({ repo }: { repo: Repo }) {
  const { data: branches, isLoading, isError, refetch } = useBranches(repo.name)
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [baseBranch, setBaseBranch] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null)

  const branchesKey = ['repos', repo.name, 'branches']

  async function handleCreate() {
    if (!branchName.trim() || !baseBranch) return
    setIsCreating(true)
    try {
      await createGithubBranch(repo.name, { branchName: branchName.trim(), baseBranch })
      await queryClient.invalidateQueries({ queryKey: branchesKey })
      toast.success(`Branch ${branchName.trim()} created`)
      setCreateOpen(false)
      setBranchName('')
      setBaseBranch('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create branch')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(name: string) {
    setDeletingBranch(name)
    try {
      await deleteGithubBranch(repo.name, name)
      await queryClient.invalidateQueries({ queryKey: branchesKey })
      toast.success(`Branch ${name} deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GitHub deletion failed on the server')
      await queryClient.invalidateQueries({ queryKey: branchesKey })
    } finally {
      setDeletingBranch(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Branches on GitHub</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              New branch
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create GitHub branch</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gh-branch-name">Branch name</Label>
                  <Input
                    id="gh-branch-name"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Base branch</Label>
                  <Select
                    value={baseBranch}
                    onValueChange={(value) => setBaseBranch(value ?? '')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a base branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!branchName.trim() || !baseBranch || isCreating}
                  onClick={handleCreate}
                >
                  {isCreating && <Loader2 className="animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading branches…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load branches.</p>}

      {branches && (
        <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/10">
          {branches.map((branch) => (
            <div key={branch.name} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate">{branch.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(branch.name)}
                disabled={deletingBranch === branch.name}
              >
                {deletingBranch === branch.name ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
              </Button>
            </div>
          ))}
          {branches.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No branches.</p>
          )}
        </div>
      )}
    </div>
  )
}
