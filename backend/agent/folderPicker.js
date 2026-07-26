import { spawn } from 'child_process'

// Opens a native OS folder-picker dialog on the machine the agent runs on,
// and resolves with the chosen absolute path, or null if the user cancelled.
export function openFolderPicker() {
    if (process.platform === 'win32') return pickWindows()
    if (process.platform === 'darwin') return pickMac()
    return pickLinux()
}

function pickWindows() {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Select the folder for this repository'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}
`
    return runPicker('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
}

function pickMac() {
    const script =
        'POSIX path of (choose folder with prompt "Select the folder for this repository")'
    return runPicker('osascript', ['-e', script])
}

function pickLinux() {
    return runPicker('zenity', [
        '--file-selection',
        '--directory',
        '--title=Select the folder for this repository',
    ])
}

function runPicker(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args)
        let stdout = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk
        })

        child.on('error', (err) => reject(err))

        // A cancelled dialog exits non-zero (or prints nothing) — treat both as "no selection"
        child.on('close', () => {
            const selected = stdout.trim()
            resolve(selected || null)
        })
    })
}
