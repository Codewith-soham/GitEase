import { runGit } from './gitExecutor.js'
import { sendFrame } from './outputStreamer.js'

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000
const KILL_GRACE_MS = 5 * 1000

// repo (cwd) -> Set of in-flight request ids, used to serialize git
// operations per-repo so two processes never mutate the same working tree
const cwdMap = new Map()
// request id -> ChildProcess, so a command can be tracked/killed
const childMap = new Map()

export function runCommand(id, { command, args, cwd, gitCommand }, ws) {
    if (cwdMap.get(cwd)?.size) {
        sendFrame(ws, id, 'error', { message: 'Another git operation is already running for this repository' })
        return
    }

    if (!cwdMap.has(cwd)) {
        cwdMap.set(cwd, new Set())
    }
    cwdMap.get(cwd).add(id)

    const cleanup = () => {
        cwdMap.get(cwd)?.delete(id)
        if (cwdMap.get(cwd)?.size === 0) {
            cwdMap.delete(cwd)
        }
        childMap.delete(id)
        clearTimeout(timeoutHandle)
    }

    const child = runGit(gitCommand ?? command, args, cwd, {
        onStdout: (chunk) => sendFrame(ws, id, 'stdout', { data: chunk.toString() }),
        onStderr: (chunk) => sendFrame(ws, id, 'stderr', { data: chunk.toString() }),
        onError: (err) => {
            sendFrame(ws, id, 'error', { message: err.message })
            cleanup()
        },
        onExit: (code) => {
            sendFrame(ws, id, 'exit', { code })
            cleanup()
        },
    })

    childMap.set(id, child)

    const timeoutHandle = setTimeout(() => {
        child.kill('SIGTERM')
        const killHandle = setTimeout(() => {
            if (childMap.has(id)) {
                child.kill('SIGKILL')
            }
        }, KILL_GRACE_MS)
        killHandle.unref?.()
        sendFrame(ws, id, 'error', { message: 'Command timed out' })
    }, DEFAULT_TIMEOUT_MS)
    timeoutHandle.unref?.()

    sendFrame(ws, id, 'started', { command })
}
