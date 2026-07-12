import { apiFetch } from '@/lib/api-client'
import type { User, Session } from '@/features/auth/types'

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/auth/v1/me')
}

export async function logout(): Promise<void> {
  return apiFetch<void>('/api/auth/v1/logout', { method: 'POST' })
}

export async function logoutAll(): Promise<void> {
  return apiFetch<void>('/api/auth/v1/logoutall', { method: 'POST' })
}

export async function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>('/api/auth/v1/sessions')
}

/**
 * Generates a new agent token.
 * The backend returns the raw token string in `data`.
 * This is shown ONCE — do not call again expecting the same value.
 */
export async function generateAgentToken(): Promise<string> {
  return apiFetch<string>('/api/auth/v1/agent-token', { method: 'POST' })
}

export async function revokeAgentToken(): Promise<void> {
  return apiFetch<void>('/api/auth/v1/agent-token', { method: 'DELETE' })
}
