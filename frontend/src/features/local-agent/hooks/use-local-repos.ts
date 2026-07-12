'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  connectLocalRepo,
  disconnectLocalRepo,
  getLocalRepos,
} from '@/features/local-agent/api/local-agent-api'

export function useLocalRepos() {
  return useQuery({
    queryKey: ['local-repos'],
    queryFn: getLocalRepos,
  })
}

export function useConnectLocalRepo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: connectLocalRepo,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['local-repos'] })
      queryClient.invalidateQueries({ queryKey: ['git', 'status', variables.repositoryId] })
    },
  })
}

export function useDisconnectLocalRepo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: disconnectLocalRepo,
    onSuccess: (_data, repositoryId) => {
      queryClient.invalidateQueries({ queryKey: ['local-repos'] })
      queryClient.invalidateQueries({ queryKey: ['git', 'status', repositoryId] })
    },
  })
}
