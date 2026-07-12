'use client'

import { useQuery } from '@tanstack/react-query'
import { getRepos } from '@/features/repositories/api/repositories-api'

export function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: getRepos,
  })
}
