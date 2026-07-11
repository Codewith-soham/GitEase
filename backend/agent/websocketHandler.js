import WebSocket from 'ws'
import { translateCommand } from './commandTranslator.js'
import { validateCommand } from './commonValidator.js'
import { runCommand } from './processManager.js'

const backendUrl = process.env.GITEASE_BACKEND_URL || 'ws://localhost:5000'
const agentToken = process.env.GITEASE_AGENT_TOKEN

const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30 * 1000

if (!agentToken) {
    console.error('GITEASE_AGENT_TOKEN is required. Set it in your environment before starting the agent.')
    process.exit(1)
}

export function createConnection() {
    let backoff = INITIAL_BACKOFF_MS

    const connect = () => {
        const ws = new WebSocket(`${backendUrl}?token=${agentToken}`)

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
        ws.on('close', () => {
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
