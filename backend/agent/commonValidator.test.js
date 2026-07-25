import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { validateCommand } from './commonValidator.js'

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'giteasee-validator-'))
  fs.mkdirSync(path.join(dir, '.git'))
  return dir
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'giteasee-validator-'))
}

test('rejects an unknown command', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'rm', args: [], cwd }),
    /Command not allowed/,
  )
})

test('rejects wrong arg count for a known command', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'commit', args: ['-m'], cwd }),
    /Invalid arg count/,
  )
})

test('rejects an arg containing shell metacharacters', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'commit', args: ['-m', 'msg; rm -rf /'], cwd }),
    /Unsafe argument rejected/,
  )
})

test('rejects an arg containing path traversal sequences', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'commit', args: ['-m', '../../etc/passwd'], cwd }),
    /Unsafe argument rejected/,
  )
})

test('rejects a cwd that does not exist', () => {
  assert.throws(
    () => validateCommand({ command: 'status', args: ['--porcelain=v2', '-b'], cwd: '/no/such/dir' }),
    /Invalid cwd/,
  )
})

test('rejects a cwd that is not a git repository (when one is required)', () => {
  const cwd = makeTempDir()
  assert.throws(
    () => validateCommand({ command: 'status', args: ['--porcelain=v2', '-b'], cwd }),
    /Not a git repository/,
  )
})

test('allows clone/init against a non-repo cwd', () => {
  const cwd = makeTempDir()
  const result = validateCommand({ command: 'init', args: [], cwd })
  assert.equal(result.command, 'init')
})

test('accepts a valid status call against a real git repo dir', () => {
  const cwd = makeTempRepo()
  const result = validateCommand({ command: 'status', args: ['--porcelain=v2', '-b'], cwd })
  assert.equal(result.command, 'status')
  assert.equal(result.cwd, path.resolve(cwd))
})

test('rejects path traversal in add file args', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'add', args: ['--', '../outside.txt'], cwd }),
    /Unsafe argument rejected/,
  )
})

test('rejects an absolute file path outside cwd for add', () => {
  const cwd = makeTempRepo()
  const outsideFile = path.join(os.tmpdir(), 'giteasee-validator-outside.txt')
  fs.writeFileSync(outsideFile, 'secret')
  // UNSAFE_PATTERN in commonValidator.js rejects literal backslashes as a
  // shell-injection guard, so a Windows-style absolute path (which contains
  // them) never reaches the file-path check — normalize to forward slashes
  // (which Node's path resolution accepts on both platforms) to actually
  // exercise the outside-cwd rejection instead of the generic char check.
  const outsideFilePosix = outsideFile.split(path.sep).join('/')
  assert.throws(
    () => validateCommand({ command: 'add', args: ['--', outsideFilePosix], cwd }),
    /Unsafe file path rejected/,
  )
})

test('accepts a file path within cwd for add', () => {
  const cwd = makeTempRepo()
  fs.writeFileSync(path.join(cwd, 'README.md'), 'hi')
  const result = validateCommand({ command: 'add', args: ['--', 'README.md'], cwd })
  assert.equal(result.command, 'add')
})

test('rejects an unsafe branch name with a leading dash', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'switchBranch', args: ['-evil'], cwd }),
    /Unsafe branch name rejected/,
  )
})

test('rejects a branch name with an embedded space', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'switchBranch', args: ['my branch'], cwd }),
    /Unsafe branch name rejected/,
  )
})

test('accepts a valid branch name', () => {
  const cwd = makeTempRepo()
  const result = validateCommand({ command: 'switchBranch', args: ['feature/my-branch'], cwd })
  assert.equal(result.command, 'switchBranch')
})

test('rejects an unsafe remote name', () => {
  const cwd = makeTempRepo()
  assert.throws(
    () => validateCommand({ command: 'pull', args: ['origin; rm -rf /'], cwd }),
    /Unsafe (argument|remote name) rejected/,
  )
})

test('accepts a valid remote name for pull', () => {
  const cwd = makeTempRepo()
  const result = validateCommand({ command: 'pull', args: ['origin'], cwd })
  assert.equal(result.command, 'pull')
})
