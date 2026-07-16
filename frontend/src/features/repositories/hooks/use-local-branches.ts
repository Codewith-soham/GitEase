'use client'

import { useQuery } from '@tanstack/react-query'
import { gitListBranches } from '@/features/repositories/api/git-api'

export function useLocalBranches(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: ['git', 'branches', repositoryId],
    queryFn: () => gitListBranches(repositoryId),
    enabled: enabled && !!repositoryId,
  })
}
