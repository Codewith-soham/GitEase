'use client'

import { useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import type Lenis from 'lenis'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const { lenis } = useLenis()

  useEffect(() => {
    if (lenis) {
      const onLenisScroll = (instance: Lenis) => setScrolled(instance.scroll > 24)
      onLenisScroll(lenis)
      lenis.on('scroll', onLenisScroll)
      return () => {
        lenis.off('scroll', onLenisScroll)
      }
    }

    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lenis])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled
            ? 'glass border-white/10 shadow-lg'
            : 'border-transparent bg-transparent'
        }`}
      >
        <a href="#top" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-purple to-blue text-primary-foreground">
            <GitBranch className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">GitEase</span>
        </a>

        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#story" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#agent" className="transition-colors hover:text-foreground">
            Local Agent
          </a>
          <a href="#vision" className="transition-colors hover:text-foreground">
            Vision
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Login
          </a>
        </div>
      </nav>
    </header>
  )
}
