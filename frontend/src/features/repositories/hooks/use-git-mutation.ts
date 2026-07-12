'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  isAgentOffline,
  isAgentTimeout,
  isOperationInProgress,
} from '@/lib/api-client'
import type { GitCommandResult } from '@/features/repositories/types'
import { useTerminalStore } from '@/features/repositories/store/terminal-store'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'

export function useGitMutation<TVariables>({
  repositoryId,
  label,
  mutationFn,
  extraInvalidateKeys,
}: {
  repositoryId: string
  label: string | ((variables: TVariables) => string)
  mutationFn: (variables: TVariables) => Promise<GitCommandResult>
  extraInvalidateKeys?: unknown[][]
}) {
  const queryClient = useQueryClient()
  const append = useTerminalStore((s) => s.append)
  const { refetch: refetchAgentStatus } = useAgentStatus()

  return useMutation({
    mutationKey: ['git-command', repositoryId],
    mutationFn,
    onSuccess: (result, variables) => {
      const entryLabel = typeof label === 'function' ? label(variables) : label
      append(repositoryId, {
        label: entryLabel,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      })

      if (result.exitCode === 0) {
        queryClient.invalidateQueries({ queryKey: ['git', 'status', repositoryId] })
        extraInvalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      }
    },
    onError: (error: unknown) => {
      if (isAgentOffline(error)) {
        refetchAgentStatus()
        return
      }
      if (isOperationInProgress(error)) {
        toast.error('Another operation is already running for this repository.')
        return
      }
      if (isAgentTimeout(error)) {
        toast.error('The agent timed out running this command.')
        return
      }
      toast.error(error instanceof Error ? error.message : 'Command failed')
    },
  })
}
