import { HomeDashboard } from "@/features/home/components/home-dashboard"
import { Navigation } from "@/components/layout/navigation"

export default function LearningHomePage() {
  return (
    <main className="min-h-screen bg-brand-surface">
      <Navigation />
      <HomeDashboard />
    </main>
  )
}
