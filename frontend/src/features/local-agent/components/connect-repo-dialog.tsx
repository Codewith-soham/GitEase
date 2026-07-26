'use client'

import { useState } from 'react'
import { FolderInput, FolderSearch, Loader2 } from 'lucide-react'
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
import { browseFolderLocalAgent } from '@/features/local-agent/api/local-agent-loopback'
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
  const [isBrowsing, setIsBrowsing] = useState(false)
  const connectMutation = useConnectLocalRepo()

  const handleBrowse = async () => {
    setIsBrowsing(true)
    try {
      const selected = await browseFolderLocalAgent()
      if (selected) {
        setLocalPath(selected)
        setError(null)
      } else {
        toast.error(
          'Could not open the folder picker. Make sure the local agent is running.',
        )
      }
    } finally {
      setIsBrowsing(false)
    }
  }

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
            <Label htmlFor="local-path">Folder</Label>
            <div className="flex gap-2">
              <Input
                id="local-path"
                value={localPath}
                readOnly
                placeholder="No folder selected"
                onClick={handleBrowse}
                className="cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowse}
                disabled={isBrowsing}
              >
                {isBrowsing ? <Loader2 className="animate-spin" /> : <FolderSearch />}
                Browse
              </Button>
            </div>
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Opens a folder picker on your machine. Requires the local agent to be running.
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
