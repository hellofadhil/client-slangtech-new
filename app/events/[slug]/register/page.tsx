import { notFound } from "next/navigation"

import { EventRegistrationForm } from "@/features/events/components/event-registration-form"
import { Navigation } from "@/components/layout/navigation"
import { getEventBySlugOrId } from "@/features/events/services/events"

type EventRegistrationPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = "force-dynamic"

export default async function EventRegistrationPage({ params }: EventRegistrationPageProps) {
  const { slug } = await params
  const eventItem = await getEventBySlugOrId(slug)

  if (!eventItem) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto w-full max-w-4xl px-6 pb-16 pt-28 md:pt-32">
        <EventRegistrationForm eventItem={eventItem} />
      </div>
    </main>
  )
}
