'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'

type LenisContextValue = {
  lenis: Lenis | null
  prefersReducedMotion: boolean
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  prefersReducedMotion: false,
})

export function useLenis() {
  return useContext(LenisContext)
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    const setup = (reduced: boolean) => {
      setPrefersReducedMotion(reduced)

      lenisRef.current?.destroy()
      lenisRef.current = null
      setLenis(null)

      if (reduced) return

      const instance = new Lenis({ syncTouch: false })
      lenisRef.current = instance
      setLenis(instance)

      const onTick = (time: number) => instance.raf(time * 1000)
      gsap.ticker.add(onTick)
      gsap.ticker.lagSmoothing(0)
      instance.on('scroll', () => ScrollTrigger.update())

      return () => {
        gsap.ticker.remove(onTick)
      }
    }

    let cleanupTick = setup(media.matches)

    const onChange = (e: MediaQueryListEvent) => {
      cleanupTick?.()
      cleanupTick = setup(e.matches)
    }
    media.addEventListener('change', onChange)

    return () => {
      media.removeEventListener('change', onChange)
      cleanupTick?.()
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
  }, [])

  return (
    <LenisContext.Provider value={{ lenis, prefersReducedMotion }}>
      {children}
    </LenisContext.Provider>
  )
}
