'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateAgentToken, revokeAgentToken } from '@/features/auth/api/auth-api'

export function useGenerateAgentToken() {
  return useMutation({
    mutationFn: generateAgentToken,
  })
}

export function useRevokeAgentToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeAgentToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['agent', 'status'] })
    },
  })
}
