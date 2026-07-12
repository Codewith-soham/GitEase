'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Code2, Terminal, BookOpen, MessagesSquare, GitBranch } from 'lucide-react'
import { GithubIcon } from './github-icon'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

const tools = [
  { icon: GithubIcon, label: 'GitHub', from: { x: -260, y: -120 }, color: 'purple' },
  { icon: Code2, label: 'VS Code', from: { x: 280, y: -90 }, color: 'blue' },
  { icon: Terminal, label: 'Terminal', from: { x: -300, y: 120 }, color: 'cyan' },
  { icon: BookOpen, label: 'Documentation', from: { x: 260, y: 140 }, color: 'purple' },
  { icon: MessagesSquare, label: 'Team Chat', from: { x: 0, y: -220 }, color: 'blue' },
]

export function ScrollStory() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const fragHeadRef = useRef<HTMLHeadingElement>(null)
  const convHeadRef = useRef<HTMLHeadingElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([])
  const { prefersReducedMotion } = useLenis()

  useGSAP(
    () => {
      const fragHead = fragHeadRef.current
      const convHead = convHeadRef.current
      const core = coreRef.current
      const nodes = nodeRefs.current
      if (!fragHead || !convHead || !core) return

      if (prefersReducedMotion) {
        gsap.set(fragHead, { opacity: 0 })
        gsap.set(convHead, { opacity: 0 })
        gsap.set(core, { opacity: 0, scale: 0.9 })
        nodes.forEach((node) => node && gsap.set(node, { opacity: 0 }))
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 70%',
          once: true,
          onEnter: () => {
            gsap.to(convHead, { opacity: 1, duration: 0.6 })
            gsap.to(core, { opacity: 1, scale: 1, duration: 0.6 })
          },
        })
        return
      }

      ScrollTrigger.matchMedia({
        '(min-width: 769px)': () => {
          gsap.set(fragHead, { opacity: 0 })
          gsap.set(convHead, { opacity: 0 })
          gsap.set(core, { opacity: 0, scale: 0.4 })
          nodes.forEach((node, i) => {
            if (!node) return
            const { from } = tools[i]
            gsap.set(node, { x: from.x * 0.25, y: from.y * 0.25, scale: 1, opacity: 1 })
          })

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: () => '+=' + window.innerHeight * 1.6,
              scrub: 1,
              pin: true,
            },
          })

          tl.to(fragHead, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0)
            .to(fragHead, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.32)
            .to(convHead, { opacity: 1, duration: 0.18, ease: 'power1.out' }, 0.5)
            .to(core, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0.45)
            .to(core, { scale: 1, duration: 0.45, ease: 'power3.inOut' }, 0.45)

          nodes.forEach((node, i) => {
            if (!node) return
            const { from } = tools[i]
            tl.to(node, { x: from.x, y: from.y, duration: 0.5, ease: 'power2.inOut' }, 0)
              .to(node, { x: 0, y: 0, duration: 0.5, ease: 'power3.inOut' }, 0.5)
              .to(node, { scale: 0.35, duration: 0.45, ease: 'power2.inOut' }, 0.5)
              .to(node, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 0.7)
          })

          return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
          }
        },
        '(max-width: 768px)': () => {
          gsap.set(fragHead, { opacity: 1 })
          gsap.set(convHead, { opacity: 0 })
          gsap.set(core, { opacity: 0, scale: 0.9 })
          nodes.forEach((node) => node && gsap.set(node, { x: 0, y: 0, scale: 1, opacity: 1 }))

          const trigger = ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top 60%',
            once: true,
            onEnter: () => {
              gsap.to(fragHead, { opacity: 0, duration: 0.4 })
              gsap.to(convHead, { opacity: 1, duration: 0.4 })
              gsap.to(core, { opacity: 1, scale: 1, duration: 0.5 })
            },
          })

          return () => trigger.kill()
        },
      })
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  return (
    <section id="story" ref={sectionRef} className="relative">
      <div className="flex h-screen items-center justify-center overflow-hidden">
        {/* headlines */}
        <h2
          ref={fragHeadRef}
          className="pointer-events-none absolute left-1/2 top-[14%] z-30 w-full -translate-x-1/2 px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl"
        >
          Development happens <span className="text-gradient">everywhere.</span>
        </h2>
        <h2
          ref={convHeadRef}
          className="pointer-events-none absolute left-1/2 top-[14%] z-30 w-full -translate-x-1/2 px-6 text-center text-3xl font-semibold tracking-tight sm:text-5xl"
        >
          GitEase brings <span className="text-gradient">everything together.</span>
        </h2>

        {/* converged core */}
        <div
          ref={coreRef}
          className="absolute z-10 grid place-items-center"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="glass flex flex-col items-center gap-2 rounded-2xl border border-white/15 px-8 py-6 glow-purple">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-purple to-blue text-primary-foreground">
              <GitBranch className="size-6" />
            </span>
            <span className="text-lg font-semibold">GitEase Workspace</span>
            <span className="text-xs text-muted-foreground">One connected surface</span>
          </div>
        </div>

        {/* floating tools */}
        {tools.map((tool, i) => (
          <ToolNode
            key={tool.label}
            tool={tool}
            ref={(el) => {
              nodeRefs.current[i] = el
            }}
          />
        ))}
      </div>
    </section>
  )
}

function ToolNode({
  tool,
  ref,
}: {
  tool: (typeof tools)[number]
  ref: (el: HTMLDivElement | null) => void
}) {
  const Icon = tool.icon

  const ring =
    tool.color === 'cyan'
      ? 'border-accent/40'
      : tool.color === 'blue'
        ? 'border-blue/40'
        : 'border-purple/40'

  return (
    <div ref={ref} className="absolute z-20" style={{ willChange: 'transform, opacity' }}>
      <div className={`glass flex items-center gap-3 rounded-xl border ${ring} px-4 py-3`}>
        <Icon className="size-5 text-foreground" />
        <span className="text-sm font-medium">{tool.label}</span>
      </div>
    </div>
  )
}
