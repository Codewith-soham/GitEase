export function GitGraphBg({ className = '' }: { className?: string }) {
  // Deterministic set of git-graph style lines and nodes
  const lanes = [120, 260, 400, 540, 680, 820, 960, 1100]
  const nodes = [
    { x: 120, y: 140 },
    { x: 260, y: 300 },
    { x: 120, y: 460 },
    { x: 400, y: 220 },
    { x: 540, y: 380 },
    { x: 680, y: 160 },
    { x: 820, y: 520 },
    { x: 960, y: 260 },
    { x: 1100, y: 420 },
    { x: 400, y: 620 },
    { x: 680, y: 700 },
    { x: 960, y: 640 },
  ]

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        className="absolute left-1/2 top-0 h-full w-[1200px] -translate-x-1/2 opacity-[0.5]"
        viewBox="0 0 1200 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gg-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.24 292)" stopOpacity="0.0" />
            <stop offset="50%" stopColor="oklch(0.62 0.24 292)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 200)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gg-line2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.6 0.22 262)" stopOpacity="0" />
            <stop offset="50%" stopColor="oklch(0.6 0.22 262)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 200)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* vertical branch lanes */}
        {lanes.map((x, i) => (
          <line
            key={`lane-${i}`}
            x1={x}
            y1="0"
            x2={x}
            y2="800"
            stroke="oklch(1 0 0 / 6%)"
            strokeWidth="1"
          />
        ))}

        {/* flowing curved branches */}
        <path
          d="M120 0 C120 160 260 200 260 320 S120 520 120 800"
          stroke="url(#gg-line)"
          strokeWidth="1.5"
          strokeDasharray="8 12"
          style={{ animation: 'dash-flow 18s linear infinite' }}
        />
        <path
          d="M400 0 C400 200 540 260 540 420 S680 620 680 800"
          stroke="url(#gg-line)"
          strokeWidth="1.5"
          strokeDasharray="8 12"
          style={{ animation: 'dash-flow 22s linear infinite' }}
        />
        <path
          d="M960 0 C960 220 820 320 820 500 S1100 640 1100 800"
          stroke="url(#gg-line2)"
          strokeWidth="1.5"
          strokeDasharray="6 14"
          style={{ animation: 'dash-flow 26s linear infinite' }}
        />
        <path
          d="M120 200 C300 200 380 220 400 220"
          stroke="url(#gg-line2)"
          strokeWidth="1.5"
        />
        <path d="M400 380 C480 380 520 380 540 380" stroke="url(#gg-line2)" strokeWidth="1.5" />
        <path d="M680 160 C780 160 900 260 960 260" stroke="url(#gg-line2)" strokeWidth="1.5" />

        {/* commit nodes */}
        {nodes.map((n, i) => (
          <g key={`node-${i}`}>
            <circle cx={n.x} cy={n.y} r="10" fill="oklch(0.62 0.24 292 / 12%)" />
            <circle
              cx={n.x}
              cy={n.y}
              r="4"
              fill={i % 3 === 0 ? 'oklch(0.78 0.15 200)' : 'oklch(0.66 0.24 290)'}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
