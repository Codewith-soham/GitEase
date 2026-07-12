'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLenis } from '@/components/animations/smooth-scroll-provider'

type Line =
  | { type: 'command'; text: string }
  | { type: 'output'; text: string; tone?: 'success' }

const SEQUENCE: Line[] = [
  { type: 'command', text: 'git checkout -b feature/auth' },
  { type: 'output', text: "Switched to a new branch 'feature/auth'" },
  { type: 'command', text: 'git add .' },
  { type: 'output', text: 'Changes staged successfully' },
  { type: 'command', text: 'git commit -m "add refresh token support"' },
  { type: 'output', text: '[feature/auth] 4 files changed' },
  { type: 'command', text: 'git push origin feature/auth' },
  { type: 'output', text: 'Enumerating objects: 12, done.' },
  { type: 'output', text: 'Compressing objects: 100%' },
  { type: 'output', text: 'Writing objects: 100%' },
  { type: 'output', text: 'To github.com:repo/project.git' },
  { type: 'output', text: '✓ Push successful', tone: 'success' },
  { type: 'output', text: '✓ Repository synchronized', tone: 'success' },
  { type: 'output', text: '✓ Team notified', tone: 'success' },
]

const TYPE_SPEED_MS = 26
const OUTPUT_GAP_MS = 140
const COMMAND_PAUSE_MS = 260
const LOOP_HOLD_MS = 1800
const LOOP_RESTART_MS = 500

type Revealed = { line: Line; chars: number; done: boolean }

export function TerminalAnimation() {
  const [revealed, setRevealed] = useState<Revealed[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const { prefersReducedMotion } = useLenis()

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealed(SEQUENCE.map((line) => ({ line, chars: line.text.length, done: true })))
      return
    }

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
      timeouts.push(id)
    }

    function runLoop() {
      setRevealed([])
      let t = 0

      SEQUENCE.forEach((line, index) => {
        if (line.type === 'command') {
          t += COMMAND_PAUSE_MS
          for (let c = 1; c <= line.text.length; c++) {
            const chars = c
            schedule(() => {
              setRevealed((prev) => {
                const next = [...prev]
                next[index] = { line, chars, done: chars === line.text.length }
                return next
              })
            }, t)
            t += TYPE_SPEED_MS
          }
        } else {
          t += OUTPUT_GAP_MS
          schedule(() => {
            setRevealed((prev) => {
              const next = [...prev]
              next[index] = { line, chars: line.text.length, done: true }
              return next
            })
          }, t)
        }
      })

      schedule(runLoop, t + LOOP_HOLD_MS + LOOP_RESTART_MS)
    }

    runLoop()

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [revealed])

  const lastTypingIndex = revealed.reduce(
    (acc, r, i) => (r?.line.type === 'command' && !r.done ? i : acc),
    -1,
  )

  return (
    <motion.div
      animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-full"
    >
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, oklch(0.62 0.24 292 / 45%) 0%, transparent 55%), radial-gradient(circle at 80% 80%, oklch(0.6 0.22 262 / 40%) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      <div className="glass glow-purple relative overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-accent/70" />
          <span className="size-2.5 rounded-full bg-primary/70" />
          <span className="ml-2 text-[11px] text-muted-foreground">gitease — feature/auth</span>
        </div>

        <div
          ref={scrollRef}
          className="h-[340px] overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed sm:h-[380px]"
        >
          {revealed.map((r, i) => {
            if (!r) return null
            const isTypingCommand = r.line.type === 'command' && i === lastTypingIndex
            if (r.line.type === 'command') {
              return (
                <div key={i} className="mt-3 flex items-start gap-1.5 first:mt-0">
                  <span className="shrink-0 text-purple">$</span>
                  <span className="break-all text-foreground">
                    {r.line.text.slice(0, r.chars)}
                    {isTypingCommand && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent align-middle" />
                    )}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={i}
                className={
                  r.line.tone === 'success'
                    ? 'mt-1 pl-4 text-accent'
                    : 'mt-1 pl-4 text-muted-foreground'
                }
              >
                {r.line.text}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
