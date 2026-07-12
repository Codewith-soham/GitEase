'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Globe, Lock, Cpu, FolderGit2, ChevronDown } from 'lucide-react'
import { GithubIcon } from './github-icon'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

const flow = [
  { icon: Globe, label: 'Browser', sub: 'GitEase workspace' },
  { icon: Lock, label: 'Encrypted WebSocket', sub: 'Instructions only', accent: true },
  { icon: Cpu, label: 'GitEase Agent', sub: 'Runs on your machine' },
  { icon: FolderGit2, label: 'Local Repository', sub: 'Your files, your disk' },
  { icon: GithubIcon, label: 'GitHub', sub: 'Push to origin' },
]

export function LocalAgent() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([])
  const chevronRefs = useRef<Array<HTMLDivElement | null>>([])
  const { prefersReducedMotion } = useLenis()

  useGSAP(
    () => {
      const nodes = nodeRefs.current.filter((n): n is HTMLDivElement => Boolean(n))
      const chevrons = chevronRefs.current.filter((c): c is HTMLDivElement => Boolean(c))
      if (nodes.length === 0) return

      if (prefersReducedMotion) {
        gsap.set([...nodes, ...chevrons], { clearProps: 'all' })
        return
      }

      gsap.set(nodes, { opacity: 0, y: 16 })
      gsap.set(chevrons, { opacity: 0 })

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline()
          nodes.forEach((node, i) => {
            tl.to(node, { opacity: 1, y: 0, duration: 0.5 }, i * 0.12)
          })
          chevrons.forEach((chevron, i) => {
            tl.to(chevron, { opacity: 1, duration: 0.4 }, i * 0.12 + 0.1)
          })
        },
      })

      return () => trigger.kill()
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  return (
    <section id="agent" ref={sectionRef} className="relative overflow-hidden py-28 sm:py-36">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.16 210 / 60%) 0%, transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Local Agent</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Your code stays on your <span className="text-gradient">machine.</span>
          </h2>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            GitEase sends instructions. Your computer executes them. Nothing leaves your machine
            except the git operations you approve.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <Lock className="size-4 text-accent" /> End-to-end encrypted control channel
            </li>
            <li className="flex items-center gap-3">
              <Cpu className="size-4 text-accent" /> Runs locally — zero code upload
            </li>
            <li className="flex items-center gap-3">
              <GithubIcon className="size-4 text-accent" /> Native GitHub authentication
            </li>
          </ul>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {flow.map((node, i) => {
            const Icon = node.icon
            return (
              <div key={node.label}>
                <div
                  ref={(el) => {
                    nodeRefs.current[i] = el
                  }}
                  className={`glass flex items-center gap-4 rounded-xl border px-5 py-4 ${
                    node.accent ? 'border-accent/40 glow-cyan' : 'border-white/10'
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-lg border ${
                      node.accent
                        ? 'border-accent/40 bg-accent/15 text-accent'
                        : 'border-white/10 bg-gradient-to-br from-purple/20 to-blue/15 text-foreground'
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{node.label}</p>
                    <p className="text-xs text-muted-foreground">{node.sub}</p>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <div
                    ref={(el) => {
                      chevronRefs.current[i] = el
                    }}
                    className="flex justify-center py-1.5"
                  >
                    <ChevronDown className="size-4 text-white/25" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
