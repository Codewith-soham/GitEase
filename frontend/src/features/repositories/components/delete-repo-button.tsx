'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
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
import { deleteGithubRepo } from '@/features/repositories/api/repositories-api'
import type { Repo } from '@/features/repositories/types'

export function DeleteRepoButton({ repo }: { repo: Repo }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const queryClient = useQueryClient()

  async function handleDelete() {
    setIsPending(true)
    try {
      await deleteGithubRepo(repo.name)
      toast.success(`${repo.name} deleted`)
      setOpen(false)
    } catch (error) {
      // Known server-side risk: GitHub repo deletion may 500 even when it
      // actually succeeds, so refetch and let the repo list be the source
      // of truth rather than trusting the thrown error. Still surface the
      // real message (e.g. missing delete_repo OAuth scope) instead of a
      // generic one.
      toast.error(error instanceof Error ? error.message : 'GitHub deletion failed on the server')
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['repos'] })
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {repo.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the repository on GitHub. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
