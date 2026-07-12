'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Textarea } from '@/components/ui/textarea'
import { createRepo } from '@/features/repositories/api/repositories-api'

export function CreateRepoDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [autoInit, setAutoInit] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createRepo,
    onSuccess: (repo) => {
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      toast.success(`${repo.name} created`)
      setOpen(false)
      setName('')
      setDescription('')
      setIsPrivate(false)
      setAutoInit(true)
      router.push(`/repositories/${encodeURIComponent(repo.name)}`)
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create repository')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({
      name: name.trim(),
      private: isPrivate,
      description: description.trim() || undefined,
      auto_init: autoInit,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New repository
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>New repository</DialogTitle>
            <DialogDescription>Create a new repository on GitHub.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repo-name">Name</Label>
              <Input
                id="repo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-project"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repo-description">Description</Label>
              <Textarea
                id="repo-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              Private repository
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={autoInit}
                onCheckedChange={(checked) => setAutoInit(checked === true)}
              />
              Initialize with README
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Create repository
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
