import { create } from 'zustand'

export interface TerminalEntry {
  id: string
  label: string
  exitCode: number
  stdout: string
  stderr: string
  at: number
}

const MAX_ENTRIES = 50

export const EMPTY_ENTRIES: TerminalEntry[] = []

interface TerminalState {
  entriesByRepo: Record<string, TerminalEntry[]>
  append: (repositoryId: string, entry: Omit<TerminalEntry, 'id' | 'at'>) => void
  clear: (repositoryId: string) => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
  entriesByRepo: {},
  append: (repositoryId, entry) =>
    set((state) => {
      const existing = state.entriesByRepo[repositoryId] ?? []
      const next = [
        ...existing,
        { ...entry, id: crypto.randomUUID(), at: Date.now() },
      ].slice(-MAX_ENTRIES)
      return { entriesByRepo: { ...state.entriesByRepo, [repositoryId]: next } }
    }),
  clear: (repositoryId) =>
    set((state) => ({
      entriesByRepo: { ...state.entriesByRepo, [repositoryId]: [] },
    })),
}))
