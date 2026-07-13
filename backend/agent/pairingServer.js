import http from 'http'

const PAIR_PORT = Number(process.env.GITEASE_AGENT_PAIR_PORT) || 8843
const ALLOWED_ORIGIN = process.env.GITEASE_FRONTEND_URL || 'http://localhost:3000'
const MAX_BODY_BYTES = 10_000

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// Local-only pairing endpoint: lets the browser hand the freshly generated
// agent token straight to the already-running agent process over loopback,
// so the user never has to copy/paste it into a terminal.
export function startPairingServer({ onToken, onReconnect, onDisconnect }) {
    const server = http.createServer((req, res) => {
        setCorsHeaders(res)

        if (req.method === 'OPTIONS') {
            res.writeHead(204)
            return res.end()
        }

        if (req.method === 'GET' && req.url === '/ping') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ ok: true }))
        }

        // Re-dials the backend WebSocket using the agent's last saved token —
        // lets the browser force a reconnect without generating a new token.
        if (req.method === 'POST' && req.url === '/reconnect') {
            const reconnected = onReconnect()
            if (!reconnected) {
                res.writeHead(409, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ ok: false, error: 'No paired token found' }))
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ ok: true }))
        }

        // Closes the current backend connection without touching the saved
        // token, so a later /reconnect can resume with it.
        if (req.method === 'POST' && req.url === '/disconnect') {
            const disconnected = onDisconnect()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ ok: true, disconnected }))
        }

        if (req.method === 'POST' && req.url === '/pair') {
            let body = ''
            let tooLarge = false

            req.on('data', (chunk) => {
                body += chunk
                if (body.length > MAX_BODY_BYTES) {
                    tooLarge = true
                    req.destroy()
                }
            })

            req.on('end', () => {
                if (tooLarge) return

                let token
                try {
                    ;({ token } = JSON.parse(body))
                } catch {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }))
                }

                if (typeof token !== 'string' || !token) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    return res.end(JSON.stringify({ ok: false, error: 'Missing token' }))
                }

                onToken(token)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ ok: true }))
            })
            return
        }

        res.writeHead(404)
        res.end()
    })

    server.on('error', (err) => {
        console.error('Pairing server error:', err.message)
    })

    server.listen(PAIR_PORT, '127.0.0.1', () => {
        console.log(`Pairing server listening on http://127.0.0.1:${PAIR_PORT}`)
    })

    return server
}
