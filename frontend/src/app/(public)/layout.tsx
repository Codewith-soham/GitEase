import { SmoothScrollProvider } from '@/components/animations/smooth-scroll-provider'

// Lenis/GSAP/ScrollTrigger are only used by the public marketing pages
// (Hero, ScrollStory, login terminal animation, etc). Scoping the provider
// here instead of the root layout keeps that bundle weight out of the
// dashboard, settings, and agent routes, which never use it.
export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SmoothScrollProvider>{children}</SmoothScrollProvider>
}
