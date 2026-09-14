import { Footer } from "@/components/layout/footer"
import { Navigation } from "@/components/layout/navigation"
import { AvailableClassesSection } from "@/features/classes/components/available-classes-section"
import { getClasses } from "@/features/classes/services/classes"

export const dynamic = "force-dynamic"

export default async function ClassesPage() {
  const classes = await getClasses({ status: "active" })

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <AvailableClassesSection classes={classes} variant="page" />
      <Footer />
    </main>
  )
}
