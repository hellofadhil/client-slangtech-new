import { Footer } from "@/components/layout/footer"
import { Navigation } from "@/components/layout/navigation"
import { AvailableEventsSection } from "@/features/events/components/available-events-section"
import { getEvents } from "@/features/events/services/events"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  const events = await getEvents({ status: "active" })

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <AvailableEventsSection events={events} />
      <Footer />
    </main>
  )
}
