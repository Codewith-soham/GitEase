'use client'

import { memo, useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useLocalBranches } from '@/features/repositories/hooks/use-local-branches'
import { useGitMutation } from '@/features/repositories/hooks/use-git-mutation'
import { gitPull } from '@/features/repositories/api/git-api'

export const GitPullDialog = memo(function GitPullDialog({
  repositoryId,
}: {
  repositoryId: string
}) {
  const [pullOpen, setPullOpen] = useState(false)
  const [pullBranch, setPullBranch] = useState('')

  const {
    data: localBranchesResult,
    isLoading: localBranchesLoading,
    isError: localBranchesError,
  } = useLocalBranches(repositoryId, pullOpen)

  const pullMutation = useGitMutation<string>({
    repositoryId,
    label: (branch) => (branch ? `git pull origin ${branch}` : 'git pull'),
    mutationFn: (branch) => gitPull(repositoryId, { branch: branch || undefined }),
  })

  useEffect(() => {
    if (pullOpen && !pullBranch && localBranchesResult) {
      const current = localBranchesResult.branches.find((b) => b.current)
      setPullBranch(current?.name ?? localBranchesResult.branches[0]?.name ?? '')
    }
  }, [pullOpen, pullBranch, localBranchesResult])

  return (
    <Dialog
      open={pullOpen}
      onOpenChange={(open) => {
        setPullOpen(open)
        if (!open) setPullBranch('')
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Download />
        Pull
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pull branch</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Branch</Label>
          <Select value={pullBranch} onValueChange={(value) => setPullBranch(value ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {localBranchesResult?.branches.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name}
                  {b.current ? ' (current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {localBranchesLoading && (
            <p className="text-xs text-muted-foreground">Loading branches…</p>
          )}
          {localBranchesError && (
            <p className="text-xs text-destructive">Failed to load branches.</p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!pullBranch || pullMutation.isPending}
            onClick={() => {
              pullMutation.mutate(pullBranch, {
                onSuccess: (result) => {
                  if (result.exitCode === 0) {
                    setPullOpen(false)
                    setPullBranch('')
                  }
                },
              })
            }}
          >
            {pullMutation.isPending && <Loader2 className="animate-spin" />}
            Pull
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
