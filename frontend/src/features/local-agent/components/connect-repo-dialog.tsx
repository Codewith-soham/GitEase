'use client'

import { useState } from 'react'
import { FolderInput, Loader2 } from 'lucide-react'
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
import { useConnectLocalRepo } from '@/features/local-agent/hooks/use-local-repos'

function validateLocalPath(p: string): string | null {
  if (!p) return 'Path is required.'
  if (p.length >= 500) return 'Path must be less than 500 characters.'
  const isAbsolute = /^([a-zA-Z]:[\\/]|\/)/.test(p)
  if (!isAbsolute) return 'Path must be absolute, e.g. C:\\Users\\you\\projects\\my-repo'
  if (p.split(/[\\/]/).includes('..')) return "Path must not contain '..' segments."
  if (/[;&|`$()<>]/.test(p)) return 'Path contains forbidden characters.'
  return null
}

export function ConnectRepoDialog({ repositoryId }: { repositoryId: string }) {
  const [open, setOpen] = useState(false)
  const [localPath, setLocalPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const connectMutation = useConnectLocalRepo()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateLocalPath(localPath)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    connectMutation.mutate(
      { repositoryId, localPath },
      {
        onSuccess: () => {
          toast.success('Repository connected')
          setOpen(false)
          setLocalPath('')
        },
        onError: (err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to connect repository')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <FolderInput />
        Connect local folder
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Connect local folder</DialogTitle>
            <DialogDescription>
              The local agent runs git commands in a folder on your machine. Point it at where
              this repository is cloned.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="local-path">Absolute path</Label>
            <Input
              id="local-path"
              value={localPath}
              onChange={(e) => {
                setLocalPath(e.target.value)
                setError(null)
              }}
              placeholder="C:\Users\you\projects\my-repo"
              autoFocus
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Absolute path, e.g. C:\Users\you\projects\my-repo
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!localPath.trim() || connectMutation.isPending}>
              {connectMutation.isPending && <Loader2 className="animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
