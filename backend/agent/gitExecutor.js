import { spawn } from 'child_process'

// Spawn git as an array of args (never a shell string) — avoids shell
// injection since args are passed directly to the process, not parsed by a shell
export function runGit(gitCommand, args, cwd, { onStdout, onStderr, onError, onExit } = {}) {
    const child = spawn('git', [gitCommand, ...args], {
        cwd,
        // Without this, a push/pull that would otherwise prompt for
        // credentials or host-key confirmation blocks forever waiting on
        // stdin we never provide — fail fast instead so the per-repo lock
        // in processManager.js can't get stuck indefinitely.
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })

    child.stdout.on('data', (chunk) => {
        onStdout?.(chunk)
    })

    child.stderr.on('data', (chunk) => {
        onStderr?.(chunk)
    })

    // Fires if git itself can't be launched (e.g. git not installed - ENOENT)
    child.on('error', (err) => {
        onError?.(err)
    })

    // Fires when the process finishes
    child.on('close', (code) => {
        onExit?.(code)
    })

    return child
}
