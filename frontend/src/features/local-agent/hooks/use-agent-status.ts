'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgentStatus } from '@/features/local-agent/api/local-agent-api'

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent', 'status'],
    queryFn: getAgentStatus,
    refetchInterval: 15_000,
    retry: false,
  })
}
