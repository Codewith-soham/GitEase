import { apiFetch } from '@/lib/api-client'
import type { AgentStatus, LocalRepo } from '@/features/local-agent/types'

export async function getAgentStatus(): Promise<AgentStatus> {
  return apiFetch<AgentStatus>('/api/git/v1/agent-status')
}

export async function getLocalRepos(): Promise<LocalRepo[]> {
  return apiFetch<LocalRepo[]>('/api/git/v1/local-repo')
}

export async function connectLocalRepo(params: {
  repositoryId: string
  localPath: string
}): Promise<LocalRepo> {
  return apiFetch<LocalRepo>('/api/git/v1/local-repo', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function disconnectLocalRepo(repositoryId: string): Promise<{ deletedRepositoryId: string }> {
  return apiFetch<{ deletedRepositoryId: string }>(`/api/git/v1/local-repo/${repositoryId}`, {
    method: 'DELETE',
  })
}
