import { describe, expect, it } from 'vitest'
import {
  parsePorcelainStatus,
  hasStagedChanges,
  hasUnstagedChanges,
  isClean,
} from './parse-porcelain-status'

describe('parsePorcelainStatus', () => {
  it('parses branch header lines', () => {
    const stdout = [
      '# branch.oid abc123',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +2 -3',
    ].join('\n')

    const { branch } = parsePorcelainStatus(stdout)
    expect(branch).toEqual({
      oid: 'abc123',
      head: 'main',
      upstream: 'origin/main',
      ahead: 2,
      behind: 3,
    })
  })

  it('parses an ordinary (1) modified entry', () => {
    const stdout = '1 M. N... 100644 100644 100644 abc def src/index.ts'
    const { entries } = parsePorcelainStatus(stdout)
    expect(entries).toEqual([
      {
        path: 'src/index.ts',
        staged: 'modified',
        unstaged: null,
        conflicted: false,
        untracked: false,
      },
    ])
  })

  it('parses a renamed (2) entry with orig path', () => {
    const stdout = '2 R. N... 100644 100644 100644 abc def R100 new/path.ts\told/path.ts'
    const { entries } = parsePorcelainStatus(stdout)
    expect(entries).toEqual([
      {
        path: 'new/path.ts',
        origPath: 'old/path.ts',
        staged: 'renamed',
        unstaged: null,
        conflicted: false,
        untracked: false,
      },
    ])
  })

  it('parses an unmerged (u) conflicted entry', () => {
    const stdout = 'u UU N... 100644 100644 100644 100644 abc def ghi conflicted.ts'
    const { entries } = parsePorcelainStatus(stdout)
    expect(entries).toEqual([
      {
        path: 'conflicted.ts',
        staged: 'unmerged',
        unstaged: 'unmerged',
        conflicted: true,
        untracked: false,
      },
    ])
  })

  it('parses an untracked (?) entry', () => {
    const stdout = '? new-file.txt'
    const { entries } = parsePorcelainStatus(stdout)
    expect(entries).toEqual([
      {
        path: 'new-file.txt',
        staged: null,
        unstaged: null,
        conflicted: false,
        untracked: true,
      },
    ])
  })

  it('ignores blank lines and ! (ignored) lines', () => {
    const stdout = ['', '! ignored.txt', ''].join('\n')
    const { entries } = parsePorcelainStatus(stdout)
    expect(entries).toEqual([])
  })
})

describe('status helpers', () => {
  it('hasStagedChanges is true only for non-conflicted staged entries', () => {
    const status = parsePorcelainStatus(
      ['1 M. N... 100644 100644 100644 abc def staged.ts'].join('\n'),
    )
    expect(hasStagedChanges(status)).toBe(true)
    expect(hasUnstagedChanges(status)).toBe(false)
  })

  it('hasUnstagedChanges is true for unstaged and untracked entries', () => {
    const status = parsePorcelainStatus(
      ['1 .M N... 100644 100644 100644 abc def unstaged.ts', '? new.txt'].join('\n'),
    )
    expect(hasUnstagedChanges(status)).toBe(true)
    expect(hasStagedChanges(status)).toBe(false)
  })

  it('conflicted entries count toward neither staged nor unstaged', () => {
    const status = parsePorcelainStatus(
      'u UU N... 100644 100644 100644 100644 abc def ghi conflicted.ts',
    )
    expect(hasStagedChanges(status)).toBe(false)
    expect(hasUnstagedChanges(status)).toBe(false)
  })

  it('isClean is true only when there are no entries', () => {
    expect(isClean(parsePorcelainStatus('# branch.oid abc123'))).toBe(true)
    expect(isClean(parsePorcelainStatus('? new.txt'))).toBe(false)
  })
})
