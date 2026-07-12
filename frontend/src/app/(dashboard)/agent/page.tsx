import { AgentSetupSteps } from '@/features/local-agent/components/agent-setup-steps'
import { AgentStatusCard } from '@/features/local-agent/components/agent-status-card'
import { AgentTokenSection } from '@/features/local-agent/components/agent-token-section'
import { ConnectedFoldersList } from '@/features/local-agent/components/connected-folders-list'

export default function AgentPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The local agent runs on your machine and executes git commands in your connected
          repositories.
        </p>
      </div>

      <AgentStatusCard />
      <AgentTokenSection />
      <AgentSetupSteps />
      <ConnectedFoldersList />
    </div>
  )
}
