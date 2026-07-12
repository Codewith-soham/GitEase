'use client'

import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/features/auth/api/auth-api'

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
