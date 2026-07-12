import type { Metadata } from 'next'
import { LoginLayout } from '@/features/auth/components/login-layout'

export const metadata: Metadata = {
  title: 'Login — GitEase',
  description: 'Connect your GitHub account to continue to GitEase, the connected developer workspace.',
}

export default function LoginPage() {
  return <LoginLayout />
}
