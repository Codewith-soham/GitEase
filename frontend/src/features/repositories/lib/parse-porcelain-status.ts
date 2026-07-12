export type Change =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'typechange'
  | 'unmerged'

export interface GitBranch {
  oid: string
  head: string
  upstream?: string
  ahead: number
  behind: number
}

export interface StatusEntry {
  path: string
  origPath?: string
  staged: Change | null
  unstaged: Change | null
  conflicted: boolean
  untracked: boolean
}

export interface GitStatus {
  branch: GitBranch
  entries: StatusEntry[]
}

const CHANGE_CODES: Record<string, Change> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'typechange',
  U: 'unmerged',
}

function codeToChange(code: string): Change | null {
  if (code === '.') return null
  return CHANGE_CODES[code] ?? null
}

/**
 * Splits a line into up to `count` space-separated fields, with the
 * remainder (untouched, may itself contain spaces) as the final element.
 */
function splitFields(line: string, count: number): string[] {
  const fields: string[] = []
  let rest = line
  for (let i = 0; i < count; i++) {
    const spaceIndex = rest.indexOf(' ')
    if (spaceIndex === -1) {
      fields.push(rest)
      rest = ''
    } else {
      fields.push(rest.slice(0, spaceIndex))
      rest = rest.slice(spaceIndex + 1)
    }
  }
  fields.push(rest)
  return fields
}

export function parsePorcelainStatus(stdout: string): GitStatus {
  const branch: GitBranch = {
    oid: '',
    head: '',
    ahead: 0,
    behind: 0,
  }
  const entries: StatusEntry[] = []

  const lines = stdout.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    if (line.length === 0) continue

    const type = line[0]

    if (type === '#') {
      const headerBody = line.slice(2)
      if (headerBody.startsWith('branch.oid ')) {
        branch.oid = headerBody.slice('branch.oid '.length)
      } else if (headerBody.startsWith('branch.head ')) {
        branch.head = headerBody.slice('branch.head '.length)
      } else if (headerBody.startsWith('branch.upstream ')) {
        branch.upstream = headerBody.slice('branch.upstream '.length)
      } else if (headerBody.startsWith('branch.ab ')) {
        const match = headerBody.match(/\+(\d+)\s+-(\d+)/)
        if (match) {
          branch.ahead = Number(match[1])
          branch.behind = Number(match[2])
        }
      }
      // other `#` lines are ignored
      continue
    }

    if (type === '1') {
      // 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
      const [, xy, , , , , , , path] = splitFields(line, 8)
      entries.push({
        path,
        staged: codeToChange(xy[0]),
        unstaged: codeToChange(xy[1]),
        conflicted: false,
        untracked: false,
      })
      continue
    }

    if (type === '2') {
      // 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X-score> <path>\t<origPath>
      const [, xy, , , , , , , , pathAndOrig] = splitFields(line, 9)
      const [path, origPath] = pathAndOrig.split('\t')
      entries.push({
        path,
        origPath,
        staged: codeToChange(xy[0]),
        unstaged: codeToChange(xy[1]),
        conflicted: false,
        untracked: false,
      })
      continue
    }

    if (type === 'u') {
      // u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      const [, xy, , , , , , , , , path] = splitFields(line, 10)
      entries.push({
        path,
        staged: codeToChange(xy[0]),
        unstaged: codeToChange(xy[1]),
        conflicted: true,
        untracked: false,
      })
      continue
    }

    if (type === '?') {
      const path = line.slice(2)
      entries.push({
        path,
        staged: null,
        unstaged: null,
        conflicted: false,
        untracked: true,
      })
      continue
    }

    // '!' (ignored) and anything unrecognized are skipped
  }

  return { branch, entries }
}

export function hasStagedChanges(status: GitStatus): boolean {
  return status.entries.some((entry) => entry.staged !== null && !entry.conflicted)
}

export function hasUnstagedChanges(status: GitStatus): boolean {
  return status.entries.some(
    (entry) => (entry.unstaged !== null || entry.untracked) && !entry.conflicted,
  )
}

export function isClean(status: GitStatus): boolean {
  return status.entries.length === 0
}
