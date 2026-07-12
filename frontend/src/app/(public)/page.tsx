import { SiteNav } from '@/components/navigation/site-nav'
import { Hero } from './_components/hero'
import { ScrollStory } from './_components/scroll-story'
import { WorkflowSection } from './_components/workflow-section'
import { LocalAgent } from './_components/local-agent'
import { Vision } from './_components/vision'
import { FinalCta, SiteFooter } from './_components/final-cta'

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteNav />
      <Hero />
      <ScrollStory />
      <WorkflowSection />
      <LocalAgent />
      <Vision />
      <FinalCta />
      <SiteFooter />
    </main>
  )
}
