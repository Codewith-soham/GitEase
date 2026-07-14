import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SmoothScrollProvider } from '@/components/animations/smooth-scroll-provider'
import { ClarityAnalytics } from '@/components/analytics/clarity'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'GitEase — The connected developer workspace',
  description:
    'GitEase brings GitHub, local development and team collaboration into one connected developer workspace. Push code, manage repositories and collaborate without leaving your workspace.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#08080d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans antialiased">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <ClarityAnalytics />}
      </body>
    </html>
  )
}
