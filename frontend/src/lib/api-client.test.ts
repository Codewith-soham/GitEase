import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiFetch,
  ApiClientError,
  isAgentOffline,
  isRepoNotConnected,
  isAgentTimeout,
  isOperationInProgress,
} from './api-client'

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('unwraps the { data } envelope on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { statusCode: 200, data: { id: 1 }, message: 'ok', success: true }),
    )

    const result = await apiFetch<{ id: number }>('/api/thing')
    expect(result).toEqual({ id: 1 })
  })

  it('refreshes and retries once on a 401, then succeeds', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(200, {}))
      .mockResolvedValueOnce(jsonResponse(200, { data: { id: 2 } }))

    const result = await apiFetch<{ id: number }>('/api/thing')
    expect(result).toEqual({ id: 2 })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('throws ApiClientError(401) when refresh itself fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(401, {}))

    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 401,
    })
  })

  it('single-flights concurrent refreshes triggered by parallel 401s', async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('refresh-token')) {
        return Promise.resolve(jsonResponse(200, {}))
      }
      return Promise.resolve(jsonResponse(401, { message: 'expired' }))
    })

    await Promise.allSettled([apiFetch('/api/a'), apiFetch('/api/b')])

    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([input]) => String(input).includes('refresh-token'))
    expect(refreshCalls.length).toBe(1)
  })

  it('throws ApiClientError with the response status for non-401 errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(404, { message: 'local repository not found' }))

    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 404,
      message: 'local repository not found',
    })
  })
})

describe('error predicates', () => {
  it('isAgentOffline matches 409 + agent not connected message', () => {
    const err = new ApiClientError('Agent not connected', 409)
    expect(isAgentOffline(err)).toBe(true)
    expect(isAgentOffline(new ApiClientError('Agent not connected', 500))).toBe(false)
    expect(isAgentOffline(new Error('nope'))).toBe(false)
  })

  it('isRepoNotConnected matches 404 + local repository not found message', () => {
    const err = new ApiClientError('Local repository not found', 404)
    expect(isRepoNotConnected(err)).toBe(true)
    expect(isRepoNotConnected(new ApiClientError('Something else', 404))).toBe(false)
  })

  it('isAgentTimeout matches 504', () => {
    expect(isAgentTimeout(new ApiClientError('timed out', 504))).toBe(true)
    expect(isAgentTimeout(new ApiClientError('timed out', 500))).toBe(false)
  })

  it('isOperationInProgress matches 409 without the agent-offline message', () => {
    const err = new ApiClientError('Operation already in progress', 409)
    expect(isOperationInProgress(err)).toBe(true)
    expect(isOperationInProgress(new ApiClientError('Agent not connected', 409))).toBe(false)
  })
})
