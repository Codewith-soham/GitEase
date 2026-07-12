'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, Loader2, TriangleAlert } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useGenerateAgentToken, useRevokeAgentToken } from '@/features/auth/hooks/use-agent-token'

export function AgentTokenSection() {
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const generateMutation = useGenerateAgentToken()
  const revokeMutation = useRevokeAgentToken()

  function handleGenerate() {
    generateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setToken(data)
        setTokenDialogOpen(true)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to generate token')
      },
    })
  }

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleRevoke() {
    revokeMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Agent token revoked')
        setRevokeOpen(false)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to revoke token')
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent token</CardTitle>
        <CardDescription>Authenticates the local agent running on your machine.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          Generate token
        </Button>

        <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Revoke token
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke agent token?</AlertDialogTitle>
              <AlertDialogDescription>
                A running agent using this token will disconnect immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} disabled={revokeMutation.isPending}>
                {revokeMutation.isPending && <Loader2 className="animate-spin" />}
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>

      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your agent token</DialogTitle>
            <DialogDescription>
              Copy it now and set it as GITEASE_AGENT_TOKEN — it will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input readOnly value={token ?? ''} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="text-accent" /> : <Copy />}
            </Button>
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-500">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            This token will not be shown again.
          </p>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
