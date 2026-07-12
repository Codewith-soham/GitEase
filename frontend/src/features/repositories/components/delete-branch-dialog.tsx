'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GitBranch, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteGithubBranch } from '@/features/repositories/api/repositories-api'
import type { Repo } from '@/features/repositories/types'

export function DeleteBranchDialog({ repo }: { repo: Repo }) {
  const [open, setOpen] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const queryClient = useQueryClient()

  async function handleDelete() {
    const name = branchName.trim()
    if (!name) return

    setIsPending(true)
    try {
      await deleteGithubBranch(repo.name, name)
      toast.success(`Branch ${name} deleted`)
      setBranchName('')
      setOpen(false)
    } catch (error) {
      // Known server-side risk: GitHub branch deletion may 500 even when it
      // actually succeeds, so refetch and let the branch list be the source
      // of truth rather than trusting the thrown error. Still surface the
      // real message instead of a generic one.
      toast.error(error instanceof Error ? error.message : 'GitHub deletion failed on the server')
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['repos', repo.name, 'branches'] })
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <GitBranch />
        Delete branch
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete a branch</AlertDialogTitle>
          <AlertDialogDescription>
            Type the exact branch name to delete from {repo.fullname || repo.name}. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`delete-branch-${repo.id}`}>Branch name</Label>
          <Input
            id={`delete-branch-${repo.id}`}
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="feature/my-branch"
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={!branchName.trim() || isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
