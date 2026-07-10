import { WebSocketServer } from "ws";
import { verifyAgentToken } from "../utils/tokenGenration.js"
import { Session } from "../models/session.model.js"
import { findAgentSessionByToken } from "../modules/auth/auth.repository.js"
import { handleAgentMessage } from "../services/agent.services.js"

const agentConnections = new Map()

export const getAgentConnection = (userId) => {
    return agentConnections.get(String(userId))
}

export const setupWebSocket = (server) => {
    const wss = new WebSocketServer({ server })

    wss.on('connection', async (ws, req) => {
        const { searchParams } = new URL(req.url, 'http://localhost')
        const token = searchParams.get('token')

        let userId

        try {
            const decoded = verifyAgentToken(token)
            userId = decoded.userId

            const hashedToken = Session.hashToken(token)
            const session = await findAgentSessionByToken(hashedToken)

            if (!session) {
                throw new Error("Session not found")
            }
        } catch (err) {
            ws.close(4001, 'Unauthorized')
            return
        }

        const existingConnection = agentConnections.get(String(userId))
        if (existingConnection) {
            existingConnection.terminate()
        }

        agentConnections.set(String(userId), ws)

        console.log("Agent connected")

        ws.on('message', (data) => {
            handleAgentMessage(userId, data)
        })

        ws.on('close', () => {
            agentConnections.delete(userId)
            console.log("Agent disconnected")
        })

        ws.on('error', (err) => {
            console.log("WebSocket error: ", err)
        })
    })

    return wss
}
