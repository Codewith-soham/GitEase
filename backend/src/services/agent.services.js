import crypto from 'crypto'
import { ApiError } from '../utils/ApiError.js'
import { getAgentConnection } from '../config/webScoket.config.js'

const pendingRequests = new Map()

const inFlightUsers = new Set()

const runAgentCommand = (userId, { command, args, cwd }, { timeoutMs = 60000 } = {}) => {
    const ws = getAgentConnection(userId)

    if (!ws) {
        throw new ApiError(409, "Local agent not connected")
    }

    const id = crypto.randomUUID()

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pendingRequests.delete(id)
            reject(new ApiError(504, "Agent command timed out"))
        }, timeoutMs)

        pendingRequests.set(id, { resolve, reject, stdout: '', stderr: '', timer })

        ws.send(JSON.stringify({ id, command, args, cwd }))
    })
}

const handleAgentMessage = (userId, data) => {
    let message

    try {
        message = JSON.parse(data.toString())
    } catch (err) {
        return
    }

    const { id, type } = message
    const pending = pendingRequests.get(id)

    if (!pending) {
        return
    }

    switch (type) {
        case 'stdout':
            pending.stdout += message.data
            break

        case 'stderr':
            pending.stderr += message.data
            break

        case 'exit':
            clearTimeout(pending.timer)
            pendingRequests.delete(id)
            pending.resolve({
                exitCode: message.code,
                stdout: pending.stdout,
                stderr: pending.stderr
            })
            break

        case 'error':
            clearTimeout(pending.timer)
            pendingRequests.delete(id)
            pending.reject(new ApiError(500, message.message || "Agent command failed"))
            break
    }
}

export { runAgentCommand, handleAgentMessage, inFlightUsers }
