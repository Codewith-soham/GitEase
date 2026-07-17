'use client'

import { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GithubBranchesTab } from '@/features/repositories/components/git-github-branches-tab'
import { LocalBranchesTab } from '@/features/repositories/components/git-local-branches-tab'
import type { Repo } from '@/features/repositories/types'

// Memoized so edits in the sibling changes/commit panel (e.g. every commit
// message keystroke) don't cascade a re-render into these tabs — each one
// mounts its own Select/Dialog trees and GitHub-branches data fetch.
export const BranchesSection = memo(function BranchesSection({
  repo,
  repositoryId,
  currentBranch,
}: {
  repo: Repo
  repositoryId: string
  currentBranch?: string
}) {
  return (
    <div className="glass rounded-xl border border-white/10 p-4">
      <Tabs defaultValue="local">
        <TabsList>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>
        <TabsContent value="local" className="pt-4">
          <LocalBranchesTab
            repo={repo}
            repositoryId={repositoryId}
            currentBranch={currentBranch}
          />
        </TabsContent>
        <TabsContent value="github" className="pt-4">
          <GithubBranchesTab repo={repo} />
        </TabsContent>
      </Tabs>
    </div>
  )
})
