'use client'

import { memo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useGitMutation } from '@/features/repositories/hooks/use-git-mutation'
import {
  gitCreateBranch,
  gitDeleteBranch,
  gitSwitchBranch,
} from '@/features/repositories/api/git-api'
import type { Repo } from '@/features/repositories/types'

export const LocalBranchesTab = memo(function LocalBranchesTab({
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
})
