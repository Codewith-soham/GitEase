'use client'

import { useMemo, useState } from 'react'
import { FolderGit2, RefreshCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateRepoDialog } from '@/features/repositories/components/create-repo-dialog'
import { RepoCard } from '@/features/repositories/components/repo-card'
import { useRepos } from '@/features/repositories/hooks/use-repos'

export default function RepositoriesPage() {
  const { data: repos, isLoading, isError, refetch, isFetching } = useRepos()
  const [search, setSearch] = useState('')

  const filteredRepos = useMemo(() => {
    if (!repos) return []
    const query = search.trim().toLowerCase()
    if (!query) return repos
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.fullname?.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query),
    )
  }, [repos, search])

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your GitHub repositories, ready to connect and manage.
          </p>
        </div>
        <CreateRepoDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories..."
          className="pl-8"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="glass flex flex-col items-center gap-3 rounded-xl border border-white/10 p-10 text-center">
          <p className="text-sm text-muted-foreground">Failed to load repositories.</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? 'animate-spin' : ''} />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && repos && repos.length === 0 && (
        <div className="glass flex flex-col items-center gap-3 rounded-xl border border-white/10 p-10 text-center">
          <FolderGit2 className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No repositories yet. Create your first one to get started.
          </p>
          <CreateRepoDialog />
        </div>
      )}

      {!isLoading && !isError && repos && repos.length > 0 && filteredRepos.length === 0 && (
        <p className="text-sm text-muted-foreground">No repositories match &ldquo;{search}&rdquo;.</p>
      )}

      {!isLoading && !isError && filteredRepos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  )
}
