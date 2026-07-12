'use client'

import { useQuery } from '@tanstack/react-query'
import { getSessions } from '@/features/auth/api/auth-api'

export function useSessions() {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: getSessions,
  })
}
