'use client'

import { useQuery } from '@tanstack/react-query'
import { getBranches } from '@/features/repositories/api/repositories-api'

export function useBranches(repoName: string) {
  return useQuery({
    queryKey: ['repos', repoName, 'branches'],
    queryFn: () => getBranches(repoName),
    enabled: !!repoName,
  })
}
