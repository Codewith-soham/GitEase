import { apiFetch } from '@/lib/api-client'
import type { Branch, Repo } from '@/features/repositories/types'

export async function getRepos(): Promise<Repo[]> {
  return apiFetch<Repo[]>('/api/repository/v1/repo')
}

export async function createRepo(body: {
  name: string
  private: boolean
  description?: string
  auto_init?: boolean
}): Promise<Repo> {
  return apiFetch<Repo>('/api/repository/v1/repo', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getBranches(repoName: string): Promise<Branch[]> {
  return apiFetch<Branch[]>(`/api/repository/v1/repo/${repoName}/branches`)
}

export async function createBranch(
  repoName: string,
  body: { branchName: string; baseBranch: string },
): Promise<Branch> {
  return apiFetch<Branch>(`/api/repository/v1/repo/${repoName}/branches`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteGithubRepo(repoName: string): Promise<unknown> {
  return apiFetch(`/api/repository/v1/repo/${repoName}`, { method: 'DELETE' })
}

export async function deleteGithubBranch(repoName: string, branchName: string): Promise<unknown> {
  return apiFetch(`/api/repository/v1/repo/${repoName}/branches/${branchName}`, {
    method: 'DELETE',
  })
}
