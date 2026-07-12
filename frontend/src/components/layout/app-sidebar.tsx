'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cable, FolderGit2, GitBranch, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/repositories', label: 'Repositories', icon: FolderGit2 },
  { href: '/agent', label: 'Agent', icon: Cable },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
              active && 'bg-primary/10 text-foreground',
            )}
          >
            {active && (
              <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-purple" />
            )}
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppSidebar() {
  return (
    <aside className="glass hidden w-60 shrink-0 flex-col border-r border-white/10 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-purple to-blue text-primary-foreground">
          <GitBranch className="size-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">GitEase</span>
      </Link>
      <AppSidebarNav />
    </aside>
  )
}
