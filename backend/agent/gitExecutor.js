import { spawn } from 'child_process'

// Spawn git as an array of args (never a shell string) — avoids shell
// injection since args are passed directly to the process, not parsed by a shell
export function runGit(gitCommand, args, cwd, { onStdout, onStderr, onError, onExit } = {}) {
    const child = spawn('git', [gitCommand, ...args], { cwd })

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
