import { Providers } from './providers'
import { AuthGate } from '@/features/auth/components/auth-gate'
import { AppShell } from '@/components/layout/app-shell'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Providers>
  )
}
