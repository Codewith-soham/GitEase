// agent.js
// Standalone local agent that runs on the user's machine
// Connects to GitEase backend via WebSocket
// Receives git commands and executes them locally

import { createConnection, disconnectCurrent } from './websocketHandler.js'
import { startPairingServer } from './pairingServer.js'
import { loadToken, saveToken } from './configStore.js'

const initialToken = process.env.AGENT_JWT_TOKEN || loadToken()

if (initialToken) {
    createConnection(initialToken)
} else {
    console.log('No agent token found. Open the GitEase dashboard and click "Connect Agent" to pair.')
}

startPairingServer({
    onToken: (token) => {
        console.log('Paired with a new agent token, connecting...')
        saveToken(token)
        createConnection(token)
    },
    onReconnect: () => {
        const token = process.env.AGENT_JWT_TOKEN || loadToken()
        if (!token) {
            console.log('Reconnect requested but no saved token found.')
            return false
        }
        console.log('Reconnect requested, re-dialing backend...')
        createConnection(token)
        return true
    },
    onDisconnect: () => {
        const disconnected = disconnectCurrent()
        console.log(
            disconnected
                ? 'Disconnect requested, closing backend connection...'
                : 'Disconnect requested but no active connection found.',
        )
        return disconnected
    },
})
