import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AGENT_DOWNLOAD_URL } from '@/lib/agent-download'

export function AgentDownloadCard() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">Download the agent</span>
          <span className="text-xs text-muted-foreground">
            Windows, Mac, and Linux — unzip it and follow the steps below.
          </span>
        </div>

        <Button className="ml-auto" size="sm" render={<a href={AGENT_DOWNLOAD_URL} />}>
          <Download />
          Download
        </Button>
      </CardContent>
    </Card>
  )
}
