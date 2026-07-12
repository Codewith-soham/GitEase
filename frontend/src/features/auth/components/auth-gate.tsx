'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMe } from '@/features/auth/hooks/use-me'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data, isLoading, isError } = useMe()

  useEffect(() => {
    if (isError) {
      router.replace('/login')
    }
  }, [isError, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <span className="text-gradient text-2xl font-semibold tracking-tight">GitEase</span>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return null
  }

  return <>{children}</>
}
