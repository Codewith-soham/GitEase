export interface User {
  _id: string
  username: string
  email: string
  avatar: string
  githubId: string
}

export interface Session {
  _id: string
  type: 'web' | 'agent'
  deviceInfo: string
  ip?: string
  userAgent?: string
  lastUsedAt: string
  expiresAt: string
  createdAt: string
}
