import { apiFetch } from '@/lib/api-client'
import type { GitCommandResult } from '@/features/repositories/types'

export async function gitStatus(repositoryId: string): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/status', {
    method: 'POST',
    body: JSON.stringify({ repositoryId }),
  })
}

export async function gitAdd(repositoryId: string, files?: string[]): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/add', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, files }),
  })
}

export async function gitCommit(
  repositoryId: string,
  commitMessage: string,
): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/commit', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, commitMessage }),
  })
}

export async function gitPush(
  repositoryId: string,
  params?: { branch?: string; remote?: string },
): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/push', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, ...params }),
  })
}

export async function gitPull(repositoryId: string): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/pull', {
    method: 'POST',
    body: JSON.stringify({ repositoryId }),
  })
}

export async function gitFetch(repositoryId: string): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/fetch', {
    method: 'POST',
    body: JSON.stringify({ repositoryId }),
  })
}

export async function gitCreateBranch(
  repositoryId: string,
  branch: string,
): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/create-branch', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, branch }),
  })
}

export async function gitSwitchBranch(
  repositoryId: string,
  branch: string,
): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/switch-branch', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, branch }),
  })
}

export async function gitDeleteBranch(
  repositoryId: string,
  branch: string,
  force?: boolean,
): Promise<GitCommandResult> {
  return apiFetch<GitCommandResult>('/api/git/v1/delete-branch', {
    method: 'POST',
    body: JSON.stringify({ repositoryId, branch, force, confirmed: true }),
  })
}
