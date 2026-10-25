"use client"

import Link from "next/link"
import type { Event } from "@/features/events/services/events"
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MessageCircle,
  Ticket,
  UsersRound,
} from "lucide-react"

type AvailableEventsSectionProps = {
  events: Event[]
}

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
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date)
}

function getSummary(text: string) {
  const firstParagraph = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstParagraph) {
    return "Detail event akan segera tersedia."
  }

  return firstParagraph.length > 124
    ? `${firstParagraph.slice(0, 121).trim()}...`
    : firstParagraph
}

function getTrainerNames(event: Event) {
  const names = event.trainers.map((trainer) => trainer.name).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "Trainer segera diumumkan"
}

function getWhatsappLink(event: Event) {
  const phoneNumber = event.contact.whatsappNumber.replace(/[^\d]/g, "")
  const eventName = getLocalizedText(event.name)
  const message = encodeURIComponent(`Halo ${event.contact.name || "Admin"}, saya tertarik ikut event ${eventName}.`)

  return phoneNumber ? `https://wa.me/${phoneNumber}?text=${message}` : ""
}

function getEventDetailPath(event: Event) {
  return `/events/${encodeURIComponent(event.slug || event.id)}`
}

export function AvailableEventsSection({ events }: AvailableEventsSectionProps) {
  return (
    <section className="bg-brand-surface px-6 pb-16 pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-3xl font-black tracking-normal text-foreground md:text-5xl">
            Event yang Tersedia
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            Pilih event yang kamu minati dan ikuti sesinya.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const image = getEventImage(event)
              const name = getLocalizedText(event.name)
              const summary = getSummary(getLocalizedText(event.longDescription))
              const whatsappLink = getWhatsappLink(event)
              const detailPath = getEventDetailPath(event)

              return (
                <article
                  key={event.id}
                  className="group flex min-h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(15,23,42,0.14)]"
                >
                  <Link href={detailPath} className="relative block aspect-[2/1] w-full overflow-hidden bg-brand-mint md:aspect-[21/9]">
                    {image ? (
                      <img
                        src={image}
                        alt={event.images[0]?.alt || name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-mint text-primary">
                        <Ticket className="size-12" />
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={detailPath}
                          className="line-clamp-1 text-xl font-black leading-tight tracking-normal text-slate-950 transition hover:text-primary"
                        >
                          {name}
                        </Link>

                        <p className="mt-1.5 text-2xl font-black text-primary">{formatPrice(event)}</p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{summary}</p>

                    <div className="mt-3">
                      <Link
                        href={detailPath}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:gap-3 hover:text-brand-green-strong"
                      >
                        Lihat Detail
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 pb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                        <CalendarDays className="size-3.5 text-primary" />
                        {formatEventDate(event.startsAt, event.timezone)}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                        <UsersRound className="size-3.5 text-primary" />
                        {getTrainerNames(event)}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                        <Clock3 className="size-3.5 text-primary" />
                        {event.sessions.length || 1} sesi
                      </span>
                    </div>

                    <div className="mt-auto space-y-3">
                      <Link
                        href={detailPath}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(11,135,65,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-green-strong hover:shadow-[0_14px_32px_rgba(11,135,65,0.3)]"
                      >
                        <Ticket className="size-4" />
                        Detail Event
                      </Link>
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-black text-foreground transition hover:border-primary/40 hover:text-primary"
                        >
                          <MessageCircle className="size-4" />
                          Hubungi Admin
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[1.35rem] bg-white p-8 sm:p-12 text-center shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-mint text-primary">
              <Ticket className="size-7" />
            </div>

            <h2 className="text-xl font-black text-foreground">Event baru segera hadir</h2>

            <p className="mx-auto mt-2 max-w-lg text-base leading-8 text-muted-foreground">
              Jadwal dan sesi terbaru sedang kami siapkan. Nantikan pengumuman event berikutnya di halaman ini.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(11,135,65,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-green-strong hover:shadow-[0_14px_32px_rgba(11,135,65,0.3)]"
              >
                Lihat Pilihan Kelas
                <ChevronRight className="size-4" />
              </Link>
              <a
                href="https://api.whatsapp.com/send/?phone=6282122210770&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-2.5 text-sm font-black text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <MessageCircle className="size-4" />
                Tanya via WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
