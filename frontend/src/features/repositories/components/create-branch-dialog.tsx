'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GitBranchPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBranch } from '@/features/repositories/api/repositories-api'
import type { Repo } from '@/features/repositories/types'

export function CreateBranchDialog({ repo }: { repo: Repo }) {
  const [open, setOpen] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const queryClient = useQueryClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = branchName.trim()
    if (!name) return

    setIsPending(true)
    try {
      await createBranch(repo.name, { branchName: name, baseBranch: repo.defaultBranch })
      await queryClient.invalidateQueries({ queryKey: ['repos', repo.name, 'branches'] })
      toast.success(`Branch ${name} created`)
      setOpen(false)
      setBranchName('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create branch')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <GitBranchPlus />
        New branch
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Create branch</DialogTitle>
            <DialogDescription>
              Branches off <span className="font-medium text-foreground">{repo.defaultBranch}</span> in{' '}
              {repo.fullname || repo.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`new-branch-${repo.id}`}>Branch name</Label>
            <Input
              id={`new-branch-${repo.id}`}
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="feature/my-branch"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!branchName.trim() || isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
