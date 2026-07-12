'use client'

import { motion } from 'motion/react'
import { ArrowRight, GitBranch } from 'lucide-react'
import { GitGraphBg } from './git-graph-bg'
import { GithubIcon } from './github-icon'

export function FinalCta() {
  return (
    <section id="get-started" className="relative overflow-hidden py-32 sm:py-44">
      <GitGraphBg />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.62 0.24 292 / 45%) 0%, transparent 60%)' }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          The future of developer workflows{' '}
          <span className="text-gradient">starts here.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Join the developers building on one connected workspace — open source, powered by GitHub.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple to-blue px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] glow-purple"
          >
            Get Started
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#login"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            <GithubIcon className="size-4" /> Star on GitHub
          </a>
        </div>
      </motion.div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-purple to-blue text-primary-foreground">
            <GitBranch className="size-4" />
          </span>
          <span className="text-base font-semibold">GitEase</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="#story" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#agent" className="transition-colors hover:text-foreground">Local Agent</a>
          <a href="#vision" className="transition-colors hover:text-foreground">Vision</a>
          <a href="#get-started" className="transition-colors hover:text-foreground">Get Started</a>
        </nav>
        <p className="text-xs text-muted-foreground">Open source • Built for developers</p>
      </div>
    </footer>
  )
}
