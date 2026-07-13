import fs from 'fs'
import os from 'os'
import path from 'path'

const CONFIG_DIR = path.join(os.homedir(), '.gitease')
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent-config.json')

export function loadToken() {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
        return JSON.parse(raw).token ?? null
    } catch {
        return null
    }
}

export function saveToken(token) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }), { mode: 0o600 })
}
