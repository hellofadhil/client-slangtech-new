"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2, MessageCircle, Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getValidSession } from "@/features/auth/services/firebase-auth"
import {
  getExistingActiveEventEnrollment,
  type EventEnrollment,
} from "@/features/enrollments/services/enrollments"
import type { Event } from "@/features/events/services/events"

type EventDetailActionsProps = {
  eventItem: Event
  registerPath: string
  whatsappLink: string
}

export function EventDetailActions({ eventItem, registerPath, whatsappLink }: EventDetailActionsProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [existingEnrollment, setExistingEnrollment] = useState<EventEnrollment | null>(null)

  useEffect(() => {
    let isMounted = true

    async function checkEventEnrollment() {
      const session = await getValidSession().catch(() => null)

      if (!isMounted) {
        return
      }

      if (!session) {
        setIsChecking(false)
        return
      }

      const activeEnrollment = await getExistingActiveEventEnrollment(session, eventItem).catch(() => null)

      if (!isMounted) {
        return
      }

      setExistingEnrollment(activeEnrollment)
      setIsChecking(false)
    }

    checkEventEnrollment()

    return () => {
      isMounted = false
    }
  }, [eventItem])

  if (existingEnrollment) {
    return (
      <div className="grid gap-3 md:w-[220px]">
        <Button type="button" size="lg" disabled className="w-full">
          <CheckCircle2 className="size-4" />
          Sudah Terdaftar
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/home">
            <Ticket className="size-4" />
            Lihat Dashboard
          </Link>
        </Button>
        {whatsappLink && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={whatsappLink} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Hubungi Admin
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:w-[220px]">
      {isChecking ? (
        <Button type="button" size="lg" className="w-full" disabled>
          <Ticket className="size-4" />
          Mengecek...
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href={registerPath}>
            <Ticket className="size-4" />
            Daftar Event
          </Link>
        </Button>
      )}
      {whatsappLink && (
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href={whatsappLink} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" />
            Hubungi Admin
          </Link>
        </Button>
      )}
    </div>
  )
}
