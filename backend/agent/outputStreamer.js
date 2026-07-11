export function sendFrame(ws, id, type, extra = {}) {
    ws.send(JSON.stringify({ id, type, ...extra }))
}
