import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Ticket,
  UsersRound,
} from "lucide-react"

import { Navigation } from "@/components/layout/navigation"
import { Badge } from "@/components/ui/badge"
import { EventDetailActions } from "@/features/events/components/event-detail-actions"
import { getEventBySlugOrId, type Event } from "@/features/events/services/events"

type EventDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = "force-dynamic"

function getLocalizedText(text: Event["name"] | Event["longDescription"]) {
  return text.id || text.en || text.zh
}

function getEventImage(event: Event) {
  return event.coverImage || event.images[0]?.url || ""
}

function formatPrice(event: Event) {
  if (event.priceType === "free" || event.price <= 0) {
    return "Gratis"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(event.price)
}

function formatEventDate(value: string, timezone = "Asia/Jakarta") {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return "Jadwal segera diumumkan"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date)
}

function formatEventTime(value: string, timezone = "Asia/Jakarta") {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date)
}

function getDescriptionBlocks(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function getTrainerNames(event: Event) {
  const names = event.trainers.map((trainer) => trainer.name).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "Trainer segera diumumkan"
}

function getWhatsappLink(event: Event) {
  const phoneNumber = event.contact.whatsappNumber.replace(/[^\d]/g, "")
  const eventName = getLocalizedText(event.name)
  const message = encodeURIComponent(`Halo ${event.contact.name || "Admin"}, saya mau tanya tentang event ${eventName}.`)

  return phoneNumber ? `https://wa.me/${phoneNumber}?text=${message}` : ""
}

function getEventRegisterPath(event: Event) {
  return `/events/${encodeURIComponent(event.slug || event.id)}/register`
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const event = await getEventBySlugOrId(slug)

  if (!event) {
    notFound()
  }

  const name = getLocalizedText(event.name)
  const image = getEventImage(event)
  const descriptionBlocks = getDescriptionBlocks(getLocalizedText(event.longDescription))
  const whatsappLink = getWhatsappLink(event)

  return (
    <main className="min-h-screen bg-brand-surface">
      <Navigation />
      <section className="px-6 pb-16 pt-28 md:pt-32">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
              <div className="h-44 w-full overflow-hidden rounded-lg bg-brand-mint md:h-[138px] md:w-[220px]">
                {image ? (
                  <img src={image} alt={event.images[0]?.alt || name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary">
                    <Ticket className="size-12" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">
                  {event.sessions.length || 1} sesi
                </Badge>
                <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                  {name}
                </h1>
                <p className="mt-3 text-2xl font-black text-primary">{formatPrice(event)}</p>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {formatEventDate(event.startsAt, event.timezone)}
                  </p>
                  <p className="flex items-center gap-2">
                    <UsersRound className="size-5 text-primary" />
                    {getTrainerNames(event)}
                  </p>
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Clock3 className="size-5 text-primary" />
                    {event.sessions.length || 1} sesi
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-brand-green-strong"
              >
                <ArrowLeft className="size-4" />
                Kembali ke daftar event
              </Link>
              <h2 className="mt-4 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                Detail Event
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Cek rangkaian event, jadwal sesi, dan lanjut daftar kalau sudah cocok.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-brand-surface p-4">
              <h3 className="text-xl font-black tracking-normal text-foreground">Tentang Event</h3>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                {(descriptionBlocks.length > 0
                  ? descriptionBlocks
                  : ["Detail event akan segera tersedia."]
                ).map((block) => (
                  <p key={block}>{block}</p>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-brand-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-normal text-foreground">Sesi Event</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Rangkaian sesi yang akan kamu ikuti.
                  </p>
                </div>
                <CalendarDays className="size-5 text-primary" />
              </div>

              <div className="mt-5 grid gap-3">
                {event.sessions.length > 0 ? (
                  event.sessions.map((session) => (
                    <div
                      key={session.id || session.sessionNumber}
                      className="grid gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <Badge variant="outline" className="border-primary/20 bg-brand-mint text-primary">
                          Sesi {session.sessionNumber || "-"}
                        </Badge>
                        <h4 className="mt-3 text-sm font-black text-foreground">
                          {session.title || `Sesi ${session.sessionNumber}`}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {formatEventDate(session.startsAt, session.timezone)}
                        </p>
                        {session.notes && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{session.notes}</p>
                        )}
                      </div>
                      <p className="text-sm font-black text-foreground sm:text-right">
                        {formatEventTime(session.startsAt, session.timezone)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-white p-5 text-sm leading-7 text-muted-foreground">
                    Jadwal sesi akan segera diumumkan.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Biaya Event</p>
                <p className="mt-2 text-3xl font-black text-primary">{formatPrice(event)}</p>
                <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    Data pendaftaran tersimpan di dashboard.
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    Sesi event bisa dipantau setelah daftar.
                  </p>
                </div>
              </div>
              <EventDetailActions
                eventItem={event}
                registerPath={getEventRegisterPath(event)}
                whatsappLink={whatsappLink}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
