import {
  GitBranch,
  GitCommit,
  ArrowUp,
  FileDiff,
  CircleDot,
  CheckCircle2,
  Activity,
  Folder,
} from 'lucide-react'

type Props = {
  activeStep?: number
}

const activity = [
  { icon: CheckCircle2, text: 'Repository synchronized', time: 'now', tone: 'cyan' },
  { icon: ArrowUp, text: 'Pushed 3 commits to origin/main', time: '2s', tone: 'purple' },
  { icon: GitCommit, text: 'feat: streaming agent updates', time: '5s', tone: 'default' },
  { icon: FileDiff, text: '4 files changed, +182 −24', time: '12s', tone: 'default' },
]

export function WorkspaceDashboard({ activeStep = -1 }: Props) {
  const changesActive = activeStep >= 0
  const commitActive = activeStep >= 1
  const pushActive = activeStep >= 2
  const syncedActive = activeStep >= 3

  return (
    <div className="glass w-full rounded-2xl border border-white/10 p-1 shadow-2xl">
      <div className="rounded-xl border border-white/5 bg-background/60 backdrop-blur-xl">
        {/* window bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-destructive/70" />
            <span className="size-3 rounded-full bg-accent/70" />
            <span className="size-3 rounded-full bg-primary/70" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Agent connected
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          {/* repo overview */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg border border-white/10 bg-linear-to-br from-purple/25 to-blue/20 text-foreground">
                <Folder className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">gitease/workspace</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="size-3" /> main
                  <span className="text-white/20">•</span>
                  <span className="text-accent">synced with origin</span>
                </p>
              </div>
            </div>
            <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-muted-foreground sm:block">
              Private
            </span>
          </div>

          {/* stat row */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Branch" value="main" icon={GitBranch} />
            <Stat
              label="Changed files"
              value={changesActive ? '4' : '0'}
              icon={FileDiff}
              highlight={changesActive}
            />
            <Stat label="Ahead" value={pushActive ? '0' : '3'} icon={ArrowUp} />
          </div>

          {/* action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                commitActive
                  ? 'border-purple/40 bg-purple/20 text-foreground'
                  : 'border-white/10 bg-white/5 text-muted-foreground'
              }`}
            >
              <GitCommit className="size-4" /> Commit
            </button>
            <button
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                pushActive
                  ? 'border-accent/50 bg-accent/20 text-foreground glow-cyan'
                  : 'border-white/10 bg-white/5 text-muted-foreground'
              }`}
            >
              <ArrowUp className="size-4" /> Push
            </button>
          </div>

          {/* progress line */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Dot on={changesActive}>Changes</Dot>
            <Line on={commitActive} />
            <Dot on={commitActive}>Commit</Dot>
            <Line on={pushActive} />
            <Dot on={pushActive}>Push</Dot>
            <Line on={syncedActive} />
            <Dot on={syncedActive}>Synced</Dot>
          </div>

          {/* activity feed */}
          <div className="rounded-lg border border-white/10 bg-white/2">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-medium text-muted-foreground">
              <Activity className="size-3.5" /> Activity
            </div>
            <ul className="divide-y divide-white/5">
              {activity.map((item, i) => {
                const Icon = item.icon
                const visible = syncedActive || i >= activity.length - 1 - Math.max(activeStep, 0)
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2.5 text-xs transition-opacity duration-500 ${
                      visible ? 'opacity-100' : 'opacity-35'
                    }`}
                  >
                    <Icon
                      className={`size-3.5 shrink-0 ${
                        item.tone === 'cyan'
                          ? 'text-accent'
                          : item.tone === 'purple'
                            ? 'text-purple'
                            : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 text-foreground/90">{item.text}</span>
                    <span className="text-muted-foreground">{item.time}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string
  value: string
  icon: typeof GitBranch
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-colors ${
        highlight ? 'border-purple/40 bg-purple/10' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 truncate font-mono text-sm text-foreground">{value}</p>
    </div>
  )
}

function Dot({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <CircleDot
        className={`size-3 transition-colors ${on ? 'text-accent' : 'text-white/20'}`}
      />
      <span className={on ? 'text-foreground/80' : ''}>{children}</span>
    </span>
  )
}

function Line({ on }: { on: boolean }) {
  return (
    <span className="h-px flex-1 overflow-hidden bg-white/10">
      <span
        className={`block h-full bg-accent transition-all duration-500 ${on ? 'w-full' : 'w-0'}`}
      />
    </span>
  )
}
