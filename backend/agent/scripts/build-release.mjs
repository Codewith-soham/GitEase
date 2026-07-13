// Builds a zip that friends can download and run without cloning the repo.
// Usage: node scripts/build-release.mjs [--backend wss://...] [--frontend https://...]
import { mkdirSync, rmSync, cpSync, writeFileSync, createWriteStream } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZipArchive } from 'archiver'

const agentDir = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(agentDir, 'dist')
const stageDir = join(distDir, 'giteasee-agent')
const zipPath = join(distDir, 'giteasee-agent.zip')

const args = new Map(
  process.argv.slice(2).reduce((pairs, arg, i, arr) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), arr[i + 1]])
    return pairs
  }, []),
)

const backendUrl = args.get('backend') ?? 'wss://gitease.onrender.com'
const frontendUrl = args.get('frontend') ?? 'https://gitease-theta.vercel.app'

const FILES_TO_INCLUDE = [
  'agent.js',
  'websocketHandler.js',
  'pairingServer.js',
  'configStore.js',
  'commandTranslator.js',
  'commonValidator.js',
  'processManager.js',
  'gitExecutor.js',
  'outputStreamer.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'start.bat',
  'start.sh',
]

rmSync(distDir, { recursive: true, force: true })
mkdirSync(stageDir, { recursive: true })

for (const file of FILES_TO_INCLUDE) {
  cpSync(join(agentDir, file), join(stageDir, file))
}

writeFileSync(
  join(stageDir, '.env'),
  `GITEASE_BACKEND_URL=${backendUrl}\nGITEASE_FRONTEND_URL=${frontendUrl}\n`,
)

const output = createWriteStream(zipPath)
const archive = new ZipArchive({ zlib: { level: 9 } })

output.on('close', () => {
  console.log(`Built ${zipPath} (${(archive.pointer() / 1024).toFixed(1)} KB)`)
  console.log(`  GITEASE_BACKEND_URL=${backendUrl}`)
  console.log(`  GITEASE_FRONTEND_URL=${frontendUrl}`)
})

archive.on('error', (err) => {
  throw err
})

archive.pipe(output)
archive.directory(stageDir, 'giteasee-agent')
archive.finalize()
