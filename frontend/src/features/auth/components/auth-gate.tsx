'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/features/auth/hooks/use-me'

// Middleware already confirmed a session cookie exists before this route
// rendered, so we render children immediately instead of blocking on this
// fetch — that blocking round-trip was the dominant LCP cost on dashboard
// routes. If the cookie turns out to be invalid/expired (and the refresh-
// token flow in api-client can't recover it), bounce to /login.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isError } = useMe()

  useEffect(() => {
    if (isError) {
      router.replace('/login')
    }
  }, [isError, router])

  return <>{children}</>
}
