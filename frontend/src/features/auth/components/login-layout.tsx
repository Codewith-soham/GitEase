'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { GitBranch } from 'lucide-react'
import { TerminalAnimation } from './terminal-animation'
import { AuthCard } from './auth-card'

export function LoginLayout() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 20 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 })

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.62 0.24 292 / 55%) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 -z-10 size-[600px] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.6 0.22 262 / 55%) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <motion.a
        href="/"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-purple to-blue text-primary-foreground glow-purple">
          <GitBranch className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">GitEase</span>
      </motion.a>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-2 text-xs text-muted-foreground"
      >
        Developer workspace powered by GitHub
      </motion.p>

      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ perspective: 1400 }}
        className="mt-14 w-full max-w-5xl"
      >
        <motion.div
          style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className="grid items-stretch gap-6 lg:grid-cols-[55fr_45fr]"
        >
          <TerminalAnimation />
          <AuthCard />
        </motion.div>
      </div>
    </main>
  )
}
