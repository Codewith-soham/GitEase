'use client'

import { motion } from 'motion/react'
import { GraduationCap, Building2, Users, Rocket, GitBranch } from 'lucide-react'

const audiences = [
  { icon: GraduationCap, label: 'Students', pos: 'top-[8%] left-[10%]' },
  { icon: Building2, label: 'Universities', pos: 'top-[14%] right-[12%]' },
  { icon: Users, label: 'Open-source communities', pos: 'bottom-[16%] left-[8%]' },
  { icon: Rocket, label: 'Startups', pos: 'bottom-[10%] right-[10%]' },
]

export function Vision() {
  return (
    <section id="vision" className="relative overflow-hidden py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl"
        >
          Built for the next generation of{' '}
          <span className="text-gradient">software teams.</span>
        </motion.h2>
      </div>

      {/* connected constellation */}
      <div className="relative mx-auto mt-16 h-[420px] max-w-4xl px-6">
        <svg className="absolute inset-0 size-full" aria-hidden="true">
          <line x1="50%" y1="50%" x2="16%" y2="18%" stroke="oklch(0.62 0.24 292 / 30%)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="84%" y2="22%" stroke="oklch(0.72 0.16 210 / 30%)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="14%" y2="80%" stroke="oklch(0.6 0.22 262 / 30%)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="86%" y2="86%" stroke="oklch(0.62 0.24 292 / 30%)" strokeWidth="1" />
        </svg>

        {/* center hub */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="glass grid size-24 place-items-center rounded-2xl border border-white/15 glow-purple">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-purple to-blue text-primary-foreground">
              <GitBranch className="size-6" />
            </span>
          </div>
        </motion.div>

        {audiences.map((a, i) => {
          const Icon = a.icon
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
              className={`absolute z-10 ${a.pos}`}
            >
              <div
                className="glass flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3"
                style={{ animation: 'float-slow 7s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}
              >
                <Icon className="size-5 text-accent" />
                <span className="text-sm font-medium">{a.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
