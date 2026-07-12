'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { FileDiff, GitCommit, ArrowUp, RefreshCw, Activity } from 'lucide-react'
import { WorkspaceDashboard } from '@/features/workspace/components/workspace-dashboard'
import { GitTerminal } from './git-terminal'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

const steps = [
  { icon: FileDiff, title: 'Changes detected', desc: 'GitEase watches your working tree in real time.' },
  { icon: GitCommit, title: 'Commit activated', desc: 'Stage and commit with a single, intentful action.' },
  { icon: ArrowUp, title: 'Push initiated', desc: 'Your local agent pushes straight to origin.' },
  { icon: RefreshCw, title: 'Repository synchronized', desc: 'Remote and local converge, instantly.' },
  { icon: Activity, title: 'Activity updated', desc: 'Your team sees the change the moment it lands.' },
]

export function WorkflowSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<Array<HTMLDivElement | null>>([])
  const [active, setActive] = useState(0)
  const { prefersReducedMotion } = useLenis()

  useGSAP(
    () => {
      const dashboard = dashboardRef.current
      const stepEls = stepRefs.current.filter((el): el is HTMLDivElement => Boolean(el))
      if (!dashboard || stepEls.length === 0) return

      if (prefersReducedMotion) {
        setActive(steps.length - 1)
        gsap.set(dashboard, { clearProps: 'all' })
        return
      }

      gsap.set(dashboard, { opacity: 0, y: 20 })
      const revealTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 70%',
        once: true,
        onEnter: () => gsap.to(dashboard, { opacity: 1, y: 0, duration: 0.6 }),
      })

      const stepTriggers = stepEls.map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        }),
      )

      return () => {
        revealTrigger.kill()
        stepTriggers.forEach((t) => t.kill())
      }
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  )

  return (
    <section id="workflow" ref={sectionRef} className="relative py-28 sm:py-36">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">The workflow</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From change to synced, without the context switch.
          </h2>
          <div className="mt-8 flex flex-col gap-3 lg:gap-[22vh]">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = i === active
              const isDone = i < active
              return (
                <div
                  key={step.title}
                  ref={(el) => {
                    stepRefs.current[i] = el
                  }}
                  className={`flex items-start gap-4 rounded-xl border p-4 transition-all duration-400 ${
                    isActive
                      ? 'border-purple/40 bg-purple/10'
                      : 'border-transparent bg-transparent'
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border transition-colors ${
                      isActive
                        ? 'border-purple/50 bg-purple/20 text-foreground'
                        : isDone
                          ? 'border-accent/40 bg-accent/15 text-accent'
                          : 'border-white/10 bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold transition-colors ${
                        isActive || isDone ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div ref={dashboardRef} className="mx-auto w-full max-w-md lg:sticky lg:top-28">
          <WorkspaceDashboard activeStep={active} />
          <GitTerminal activeStep={active} />
        </div>
      </div>
    </section>
  )
}
