'use client'

import { memo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useQueryClient } from '@tanstack/react-query'
import { useBranches } from '@/features/repositories/hooks/use-branches'
import {
  createBranch as createGithubBranch,
  deleteGithubBranch,
} from '@/features/repositories/api/repositories-api'
import type { Repo } from '@/features/repositories/types'

export const GithubBranchesTab = memo(function GithubBranchesTab({ repo }: { repo: Repo }) {
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
})
