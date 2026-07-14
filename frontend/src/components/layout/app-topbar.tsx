'use client'

import Link from 'next/link'
import { Download, ExternalLink, LogOut, Menu, Settings as SettingsIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentStatusIndicator } from '@/features/local-agent/components/agent-status-indicator'
import { useMe } from '@/features/auth/hooks/use-me'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { AGENT_DOWNLOAD_URL } from '@/lib/agent-download'

export function AppTopbar({
  title,
  onOpenMobileNav,
}: {
  title?: string
  onOpenMobileNav?: () => void
}) {
  const { data: user } = useMe()
  const { logoutMutation } = useLogout()

  return (
    <header className="glass sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      <h1 className="flex-1 truncate text-sm font-medium text-foreground">{title}</h1>

      <AgentStatusIndicator />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<button type="button" aria-label="Account menu" />}
        >
          <Avatar size="sm">
            <AvatarImage src={user?.avatar} alt={user?.username ?? 'User'} />
            <AvatarFallback>{user?.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<a href={AGENT_DOWNLOAD_URL} />}>
            <Download />
            Download agent
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          {user?.username && (
            <DropdownMenuItem
              render={
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink />
              GitHub profile
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
