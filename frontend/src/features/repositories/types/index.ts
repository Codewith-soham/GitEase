export interface Repo {
  id: number
  name: string
  fullname?: string
  description: string | null
  visibility: string
  defaultBranch: string
  url: string
  language: string | null
  updatedAt: string
}

export interface Branch {
  name: string
  sha: string
}

export interface GitCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}
