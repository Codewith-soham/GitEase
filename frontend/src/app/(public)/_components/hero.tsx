'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Sparkles, Code2 } from 'lucide-react'
import { GitGraphBg } from './git-graph-bg'
import { WorkspaceDashboard } from '@/features/workspace/components/workspace-dashboard'
import { GithubIcon } from './github-icon'

const badges = [
  { icon: GithubIcon, label: 'Powered by GitHub' },
  { icon: Sparkles, label: 'Open Source' },
  { icon: Code2, label: 'Built for Developers' },
]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const tx = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 })
  const ty = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })

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
    <section id="top" className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
      <GitGraphBg />
      {/* radial glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-0 size-[720px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, oklch(0.62 0.24 292 / 55%) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-40 -z-0 size-[500px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, oklch(0.72 0.16 210 / 55%) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            The connected developer workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Push code, manage repositories and{' '}
            <span className="text-gradient">collaborate</span> without leaving your workspace.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            GitEase brings GitHub, local development and team collaboration into one connected
            developer workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple to-blue px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] glow-purple"
            >
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              Login
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
          >
            {badges.map((b) => {
              const Icon = b.icon
              return (
                <li key={b.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-4 text-accent" />
                  {b.label}
                </li>
              )
            })}
          </motion.ul>
        </div>

        {/* parallax dashboard */}
        <motion.div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ perspective: 1200 }}
          className="relative"
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, x: tx, y: ty, transformStyle: 'preserve-3d' }}>
            <WorkspaceDashboard activeStep={3} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
