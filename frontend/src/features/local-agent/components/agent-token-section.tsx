'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, KeyRound, Loader2, Plug, TriangleAlert } from 'lucide-react'
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
import { pairLocalAgent, pingLocalAgent } from '@/features/local-agent/api/local-agent-loopback'

export function AgentTokenSection() {
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const queryClient = useQueryClient()
  const generateMutation = useGenerateAgentToken()
  const revokeMutation = useRevokeAgentToken()

  const { data: agentReachable } = useQuery({
    queryKey: ['agent', 'loopback-reachable'],
    queryFn: pingLocalAgent,
    refetchInterval: 5000,
    retry: false,
  })

  function refreshAgentStatus() {
    queryClient.invalidateQueries({ queryKey: ['agent', 'status'] })
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['agent', 'status'] }), 2000)
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      // Only one agent token should ever be live — clear any previous one
      // before minting a fresh one, so the agent always ends up holding
      // exactly the token that's actually valid.
      await revokeMutation.mutateAsync().catch(() => {})
      const newToken = await generateMutation.mutateAsync()
      const paired = await pairLocalAgent(newToken)

      if (paired) {
        toast.success('Agent connected')
        refreshAgentStatus()
        return
      }

      // Agent isn't reachable on loopback — fall back to manual setup.
      setToken(newToken)
      setTokenDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setConnecting(false)
    }
  }

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
        <CardDescription>
          {agentReachable
            ? 'A local agent is running — connect it to your account in one click.'
            : 'Authenticates the local agent running on your machine.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {agentReachable ? (
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="animate-spin" /> : <Plug />}
            Connect Agent
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Generate token
          </Button>
        )}

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
