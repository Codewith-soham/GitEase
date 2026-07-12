'use client'

import { ArrowRight, ShieldCheck, KeyRound, GitBranch, Laptop } from 'lucide-react'
import { motion } from 'motion/react'
import { GithubIcon } from '@/app/(public)/_components/github-icon'

const AUTH_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000') + '/api/auth/v1/github'

const trustPoints = [
  { icon: ShieldCheck, label: 'Secure GitHub OAuth' },
  { icon: KeyRound, label: 'No passwords stored' },
  { icon: GitBranch, label: 'Open Source' },
  { icon: Laptop, label: 'Your code stays on your machine' },
]

export function AuthCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="glass relative w-full rounded-2xl border border-white/10 p-8 sm:p-10"
    >
      <div
        className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-50 blur-2xl"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, oklch(0.62 0.24 292 / 35%) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome Back</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Connect your GitHub account to continue.
      </p>

      <a
        href={AUTH_URL}
        className="group relative mt-8 flex w-full items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-lg transition-transform duration-300 hover:scale-[1.015] active:scale-[0.99]"
      >
        <span
          className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-r from-purple to-blue opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
          aria-hidden="true"
        />
        <span className="flex items-center gap-2.5">
          <GithubIcon className="size-4.5" />
          Continue with GitHub
        </span>
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>

      <ul className="mt-8 space-y-3">
        {trustPoints.map((point) => (
          <li key={point.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <point.icon className="size-4 shrink-0 text-accent" />
            {point.label}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
