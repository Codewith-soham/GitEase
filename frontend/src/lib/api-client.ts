// Requests go through next.config.mjs's /api/:path* rewrite, which proxies
// to BACKEND_URL server-side. This keeps everything same-origin from the
// browser's perspective, so auth cookies are first-party (readable by
// middleware, not blocked by third-party cookie restrictions).
export const API_URL = ''

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiClientError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.payload = payload
  }
}

// ---------------------------------------------------------------------------
// Single-flight refresh (module-scoped shared promise)
// ---------------------------------------------------------------------------

let refreshPromise: Promise<void> | null = null

async function refreshToken(): Promise<void> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${API_URL}/api/auth/v1/refresh-token`, {
    method: 'POST',
    credentials: 'include',
  }).then(async (res) => {
    refreshPromise = null
    if (!res.ok) {
      throw new ApiClientError('Refresh failed', res.status)
    }
  }).catch((err) => {
    refreshPromise = null
    throw err
  })

  return refreshPromise
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

const REFRESH_PATH = '/api/auth/v1/refresh-token'

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { _retried?: boolean },
): Promise<T> {
  const isRefreshEndpoint = path === REFRESH_PATH
  const alreadyRetried = init?._retried ?? false

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (response.ok) {
    const body = await response.json()
    // Unwrap the success envelope: { statusCode, data, message, success }
    return body.data as T
  }

  // 401 handling — single-flight refresh then retry once
  if (response.status === 401 && !isRefreshEndpoint && !alreadyRetried) {
    try {
      await refreshToken()
      return apiFetch<T>(path, { ...init, _retried: true })
    } catch {
      const errBody = await response.json().catch(() => ({}))
      throw new ApiClientError(
        errBody?.message ?? 'Unauthorized',
        401,
        errBody,
      )
    }
  }

  // All other errors
  const errBody = await response.json().catch(() => ({}))
  throw new ApiClientError(
    errBody?.message ?? `HTTP ${response.status}`,
    response.status,
    errBody,
  )
}

// ---------------------------------------------------------------------------
// Predicates for typed error handling
// ---------------------------------------------------------------------------

export function isAgentOffline(e: unknown): boolean {
  return (
    e instanceof ApiClientError &&
    e.status === 409 &&
    /agent not connected/i.test(e.message)
  )
}

export function isRepoNotConnected(e: unknown): boolean {
  return (
    e instanceof ApiClientError &&
    e.status === 404 &&
    /local repository not found/i.test(e.message)
  )
}

export function isAgentTimeout(e: unknown): boolean {
  return e instanceof ApiClientError && e.status === 504
}

export function isOperationInProgress(e: unknown): boolean {
  return (
    e instanceof ApiClientError &&
    e.status === 409 &&
    !/agent not connected/i.test(e.message)
  )
}
