'use client'

import { useQuery } from '@tanstack/react-query'
import { gitStatus } from '@/features/repositories/api/git-api'
import { parsePorcelainStatus, type GitStatus } from '@/features/repositories/lib/parse-porcelain-status'
import { useAgentStatus } from '@/features/local-agent/hooks/use-agent-status'
import { useLocalRepos } from '@/features/local-agent/hooks/use-local-repos'

export function useGitStatus(repositoryId: string) {
  const { data: agentStatus } = useAgentStatus()
  const { data: localRepos } = useLocalRepos()

  const folderConnected =
    localRepos?.some((lr) => lr.repositoryId === repositoryId) ?? false
  const agentOnline = agentStatus?.connected === true

  const query = useQuery({
    queryKey: ['git', 'status', repositoryId],
    queryFn: () => gitStatus(repositoryId),
    enabled: folderConnected && agentOnline,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const parsed: GitStatus | null =
    query.data && query.data.exitCode === 0 ? parsePorcelainStatus(query.data.stdout) : null

  return { ...query, parsed, folderConnected, agentOnline }
}
