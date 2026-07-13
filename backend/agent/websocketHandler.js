import WebSocket from 'ws'
import { translateCommand } from './commandTranslator.js'
import { validateCommand } from './commonValidator.js'
import { runCommand } from './processManager.js'
import { clearToken } from './configStore.js'

// Close code the backend uses for both a failed handshake and a
// backend-initiated revoke (see webScoket.config.js / auth.service.js) —
// either way, this exact token will never succeed again.
const TOKEN_REJECTED_CODE = 4001

const backendUrl = process.env.GITEASE_BACKEND_URL || 'ws://localhost:5000'

const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30 * 1000

let currentWs = null
// Bumped on every createConnection() call so a stale reconnect loop from a
// previous (revoked/replaced) token stops retrying once a new one takes over.
let generation = 0

export function createConnection(token) {
    if (!token) {
        console.error('No agent token available yet. Open the GitEase dashboard and click "Connect Agent" to pair.')
        return
    }

    generation += 1
    const myGeneration = generation

    if (currentWs) {
        currentWs.removeAllListeners()
        currentWs.terminate()
        currentWs = null
    }

    let backoff = INITIAL_BACKOFF_MS

    const connect = () => {
        if (myGeneration !== generation) return

        const ws = new WebSocket(`${backendUrl}?token=${token}`)
        currentWs = ws

        // Fires when connection is established
        ws.on('open', () => {
            console.log('Connected to GitEase backend')
            backoff = INITIAL_BACKOFF_MS
        })

        // Fires when backend sends a command, e.g. { command: 'status', args: [], cwd: '/path/to/repo' }
        // Translates it to a git subcommand/args, validates it (whitelist + safe
        // args + real cwd), runs it via git CLI, and streams stdout/stderr/exit
        // code back over the same socket so the UI can show it like a live terminal.
        ws.on('message', (data) => {
            console.log('Received:', data.toString())

            // Parse incoming JSON safely — never trust raw input
            let payload
            try {
                payload = JSON.parse(data.toString())
            } catch {
                return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
            }

            const { id } = payload

            let gitCommand
            let translatedArgs
            try {
                const translated = translateCommand(payload)
                gitCommand = translated.gitCommand
                translatedArgs = translated.args
            } catch (err) {
                return ws.send(JSON.stringify({ id, type: 'error', message: err.message }))
            }

            // Reject anything not on the whitelist, with bad arg counts, unsafe
            // characters in args, or a cwd that doesn't exist / isn't a git repo
            let validated
            try {
                validated = validateCommand({ ...payload, args: translatedArgs })
            } catch (err) {
                return ws.send(JSON.stringify({ id, type: 'error', message: err.message }))
            }

            const { command, args, cwd } = validated

            runCommand(id, { command, args, cwd, gitCommand }, ws)
        })

        // Fires when connection is closed
        ws.on('close', (code) => {
            if (myGeneration !== generation) return

            if (code === TOKEN_REJECTED_CODE) {
                console.log(
                    'Agent token was rejected or revoked — clearing saved token. Open the GitEase dashboard and click "Connect Agent" to re-pair.',
                )
                clearToken()
                return
            }

            console.log('Disconnected from backend')
            setTimeout(connect, backoff)
            backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
        })

        // Fires on connection error
        ws.on('error', (err) => {
            console.error('Error:', err.message)
        })

        return ws
    }

    return connect()
}

// Closes the current connection and stops its reconnect loop (bumping
// `generation` makes the closing connection's own `close` handler a no-op,
// so it won't immediately redial itself). The saved token is untouched —
// createConnection(token) can resume the connection later.
export function disconnectCurrent() {
    if (!currentWs) return false

    generation += 1
    currentWs.removeAllListeners()
    currentWs.terminate()
    currentWs = null

    return true
}
