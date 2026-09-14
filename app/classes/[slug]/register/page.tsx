import { notFound } from "next/navigation"

import { ClassRegistrationForm } from "@/features/classes/components/class-registration-form"
import { Navigation } from "@/components/layout/navigation"
import { getClassBySlugOrId } from "@/features/classes/services/classes"

type ClassRegistrationPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = "force-dynamic"

export default async function ClassRegistrationPage({ params }: ClassRegistrationPageProps) {
  const { slug } = await params
  const classItem = await getClassBySlugOrId(slug)

  if (!classItem) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto w-full max-w-4xl px-6 pb-16 pt-28 md:pt-32">
        <ClassRegistrationForm classItem={classItem} />
      </div>
    </main>
  )
}
