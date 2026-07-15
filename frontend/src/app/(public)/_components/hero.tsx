import { ArrowRight, Sparkles, Code2 } from 'lucide-react'
import { GitGraphBg } from './git-graph-bg'
import { HeroParallax } from './hero-parallax'
import { WorkspaceDashboard } from '@/features/workspace/components/workspace-dashboard'
import { GithubIcon } from './github-icon'

const badges = [
  { icon: GithubIcon, label: 'Powered by GitHub' },
  { icon: Sparkles, label: 'Open Source' },
  { icon: Code2, label: 'Built for Developers' },
]

export function Hero() {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            The connected developer workspace
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Push code, manage repositories and{' '}
            <span className="text-gradient">collaborate</span> without leaving your workspace.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            GitEase brings GitHub, local development and team collaboration into one connected
            developer workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
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
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {badges.map((b) => {
              const Icon = b.icon
              return (
                <li key={b.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-4 text-accent" />
                  {b.label}
                </li>
              )
            })}
          </ul>
        </div>

        <HeroParallax>
          <WorkspaceDashboard activeStep={3} />
        </HeroParallax>
      </div>
    </section>
  )
}
