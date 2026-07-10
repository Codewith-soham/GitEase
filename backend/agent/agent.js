// agent.js
// Standalone local agent that runs on the user's machine
// Connects to GitEase backend via WebSocket
// Receives git commands and executes them locally

import WebSocket from 'ws'
import { spawn } from 'child_process'
import { validateCommand } from './commonValidator.js'

const backendUrl = process.env.GITEASE_BACKEND_URL || 'ws://localhost:5000'
const agentToken = process.env.GITEASE_AGENT_TOKEN

if (!agentToken) {
    console.error('GITEASE_AGENT_TOKEN is required. Set it in your environment before starting the agent.')
    process.exit(1)
}

// Connect to backend WebSocket server
const ws = new WebSocket(`${backendUrl}?token=${agentToken}`)

// Fires when connection is established
ws.on('open', () => {
    console.log('Connected to GitEase backend')
})

// Fires when backend sends a command, e.g. { command: 'status', args: [], cwd: '/path/to/repo' }
// Validates it (whitelist + safe args + real cwd), runs it via git CLI,
// and streams stdout/stderr/exit code back over the same socket so the UI
// can show it like a live terminal.
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

    // Reject anything not on the whitelist, with bad arg counts, unsafe
    // characters in args, or a cwd that doesn't exist / isn't a git repo
    let validated
    try {
        validated = validateCommand(payload)
    } catch (err) {
        return ws.send(JSON.stringify({ id, type: 'error', message: err.message }))
    }

    const { command, args, cwd } = validated

    // Spawn git as an array of args (never a shell string) — avoids shell
    // injection since args are passed directly to the process, not parsed by a shell
    const child = spawn('git', [command, ...args], { cwd })

    // Stream live stdout back as it arrives (real-time terminal feel)
    child.stdout.on('data', (chunk) => {
        ws.send(JSON.stringify({ id, type: 'stdout', data: chunk.toString() }))
    })

    // Stream live stderr back as it arrives
    child.stderr.on('data', (chunk) => {
        ws.send(JSON.stringify({ id, type: 'stderr', data: chunk.toString() }))
    })

    // Fires if git itself can't be launched (e.g. git not installed - ENOENT)
    child.on('error', (err) => {
        ws.send(JSON.stringify({ id, type: 'error', message: err.message }))
    })

    // Fires when the process finishes — send final exit code so UI knows
    // whether the command succeeded (0) or failed (non-zero)
    child.on('close', (code) => {
        ws.send(JSON.stringify({ id, type: 'exit', code }))
    })
})

// Fires when connection is closed
ws.on('close', () => {
    console.log('Disconnected from backend')
})

// Fires on connection error
ws.on('error', (err) => {
    console.error('Error:', err.message)
})