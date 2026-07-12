'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

const commands = [
  { prompt: 'git status', output: 'On branch main\nChanges not staged for commit: 4 files' },
  {
    prompt: 'git add . && git commit -m "feat: update workspace"',
    output: '[main 4a1f9c2] feat: update workspace\n 4 files changed, 182 insertions(+), 24 deletions(-)',
  },
  { prompt: 'git push origin main', output: 'Enumerating objects... done.\nTo github.com:gitease/workspace.git' },
  { prompt: 'git fetch && git status', output: "Your branch is up to date with 'origin/main'." },
  { prompt: 'git log --oneline -1', output: '4a1f9c2 (HEAD -> main, origin/main) feat: update workspace' },
]

export function GitTerminal({ activeStep }: { activeStep: number }) {
  const promptRef = useRef<HTMLSpanElement>(null)
  const outputRef = useRef<HTMLPreElement>(null)
  const prevStep = useRef(-1)
  const { prefersReducedMotion } = useLenis()

  useEffect(() => {
    const idx = Math.max(0, Math.min(commands.length - 1, activeStep))
    if (prevStep.current === idx) return
    prevStep.current = idx

    const promptEl = promptRef.current
    const outputEl = outputRef.current
    if (!promptEl || !outputEl) return

    const { prompt, output } = commands[idx]

    gsap.killTweensOf([promptEl, outputEl])

    if (prefersReducedMotion) {
      promptEl.textContent = prompt
      outputEl.textContent = output
      gsap.set(outputEl, { opacity: 1 })
      return
    }

    outputEl.textContent = ''
    gsap.set(outputEl, { opacity: 0 })

    const typeTarget = { chars: 0 }
    gsap.to(typeTarget, {
      chars: prompt.length,
      duration: Math.min(1.1, prompt.length * 0.035),
      ease: 'none',
      onUpdate: () => {
        promptEl.textContent = prompt.slice(0, Math.round(typeTarget.chars))
      },
      onComplete: () => {
        outputEl.textContent = output
        gsap.to(outputEl, { opacity: 1, duration: 0.3 })
      },
    })
  }, [activeStep, prefersReducedMotion])

  return (
    <div className="glass mt-4 w-full rounded-xl border border-white/10 px-4 py-3 font-mono text-xs">
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-accent/70" />
        <span className="size-2.5 rounded-full bg-primary/70" />
        <span className="ml-2 text-[11px] text-muted-foreground">terminal</span>
      </div>
      <div className="flex items-start gap-1.5 text-accent">
        <span className="shrink-0 text-muted-foreground">$</span>
        <span className="break-all">
          <span ref={promptRef} />
          <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-accent align-middle" />
        </span>
      </div>
      <pre ref={outputRef} className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground opacity-0" />
    </div>
  )
}
