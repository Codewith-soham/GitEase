'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { GitBranch } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AppSidebar, AppSidebarNav } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/repositories': 'Repositories',
  '/agent': 'Agent',
  '/settings': 'Settings',
}

function resolveTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
  return match ? PAGE_TITLES[match] : 'GitEase'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-4"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-purple to-blue text-primary-foreground">
              <GitBranch className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">GitEase</span>
          </Link>
          <div onClick={() => setMobileNavOpen(false)}>
            <AppSidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title={resolveTitle(pathname)} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
