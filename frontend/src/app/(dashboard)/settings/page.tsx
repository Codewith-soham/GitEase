'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
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
import { DangerZone } from '@/features/auth/components/danger-zone'
import { ProfileCard } from '@/features/auth/components/profile-card'
import { SessionsList } from '@/features/auth/components/sessions-list'
import { useRevokeAgentToken } from '@/features/auth/hooks/use-agent-token'

function AgentTokenCard() {
  const [open, setOpen] = useState(false)
  const revokeMutation = useRevokeAgentToken()

  function handleRevoke() {
    revokeMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Agent token revoked')
        setOpen(false)
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
          Manage the token that authenticates your local agent from the{' '}
          <Link href="/agent">Agent page</Link>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Revoke agent token
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
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <ProfileCard />
      <SessionsList />
      <AgentTokenCard />
      <DangerZone />
    </div>
  )
}
