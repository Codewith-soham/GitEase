const LOOPBACK_URL =
  process.env.NEXT_PUBLIC_AGENT_LOOPBACK_URL ?? 'http://127.0.0.1:8843'

const PING_TIMEOUT_MS = 1200
const PAIR_TIMEOUT_MS = 4000
const RECONNECT_TIMEOUT_MS = 4000
const DISCONNECT_TIMEOUT_MS = 4000
// The native folder dialog stays open until the user picks a folder or
// cancels it, so this has to be long enough to not abort mid-pick.
const BROWSE_TIMEOUT_MS = 5 * 60 * 1000

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}

/** Checks whether a local agent process is already running and reachable. */
export async function pingLocalAgent(): Promise<boolean> {
  const { signal, clear } = withTimeout(PING_TIMEOUT_MS)
  try {
    const res = await fetch(`${LOOPBACK_URL}/ping`, { signal })
    return res.ok
  } catch {
    return false
  } finally {
    clear()
  }
}

/** Hands a freshly generated agent token straight to the local agent process. */
export async function pairLocalAgent(token: string): Promise<boolean> {
  const { signal, clear } = withTimeout(PAIR_TIMEOUT_MS)
  try {
    const res = await fetch(`${LOOPBACK_URL}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clear()
  }
}

/** Asks the local agent to open a native folder-picker dialog and returns the chosen absolute path, or null if cancelled/unavailable. */
export async function browseFolderLocalAgent(): Promise<string | null> {
  const { signal, clear } = withTimeout(BROWSE_TIMEOUT_MS)
  try {
    const res = await fetch(`${LOOPBACK_URL}/browse-folder`, { method: 'POST', signal })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.path === 'string' ? data.path : null
  } catch {
    return null
  } finally {
    clear()
  }
}

/** Asks an already-running local agent to re-dial the backend using its last saved token. */
export async function reconnectLocalAgent(): Promise<boolean> {
  const { signal, clear } = withTimeout(RECONNECT_TIMEOUT_MS)
  try {
    const res = await fetch(`${LOOPBACK_URL}/reconnect`, { method: 'POST', signal })
    return res.ok
  } catch {
    return false
  } finally {
    clear()
  }
}

/** Asks the local agent to close its backend connection, keeping its saved token for later. */
export async function disconnectLocalAgent(): Promise<boolean> {
  const { signal, clear } = withTimeout(DISCONNECT_TIMEOUT_MS)
  try {
    const res = await fetch(`${LOOPBACK_URL}/disconnect`, { method: 'POST', signal })
    return res.ok
  } catch {
    return false
  } finally {
    clear()
  }
}
