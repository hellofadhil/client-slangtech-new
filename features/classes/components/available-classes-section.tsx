"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Class } from "@/features/classes/services/classes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  User,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

type AvailableClassesSectionProps = {
  classes: Class[]
  variant?: "home" | "page"
}

const typeMetaLabel: Record<Class["type"], string> = {
  private: "Kelas Private",
  group: "Kelas Grup",
}

function getLocalizedText(text: Class["name"] | Class["longDescription"]) {
  return text.id || text.en || text.zh
}

function getClassImage(classItem: Class) {
  return classItem.coverImage || classItem.images[0]?.url || ""
}

function getClassDetailPath(classItem: Class) {
  return `/classes/${encodeURIComponent(classItem.slug || classItem.id)}`
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

function getSummary(text: string) {
  const firstParagraph = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstParagraph) {
    return "Detail kelas akan segera tersedia."
  }

  return firstParagraph.length > 116
    ? `${firstParagraph.slice(0, 113).trim()}...`
    : firstParagraph
}

function getProgramRangeText(classItem: Class) {
  const startDate =
    "startDate" in classItem && classItem.startDate
      ? new Date(classItem.startDate as string)
      : null

  const endDate =
    "endDate" in classItem && classItem.endDate
      ? new Date(classItem.endDate as string)
      : null

  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${classItem.totalSessions} sesi - ${classItem.sessionDurationMinutes} menit/sesi`
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

function getDescriptionBlocks(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function renderDescriptionBlock(block: string, index: number) {
  const numberedItems = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\.\s*(.+)$/)
      return match ? { number: match[1], text: match[2] } : null
    })
    .filter((item): item is { number: string; text: string } => item !== null)

  if (numberedItems.length > 0) {
    return (
      <div key={index} className="space-y-3">
        {numberedItems.map((item) => (
          <div key={`${item.number}-${item.text}`} className="flex gap-3">
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-mint font-mono text-sm font-bold text-primary">
              {item.number}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <p key={index} className="leading-8">
      {block}
    </p>
  )
}

function ClassDescriptionModal({ classItem }: { classItem: Class }) {
  const description = getLocalizedText(classItem.longDescription)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:gap-3 hover:text-brand-green-strong">
          Selengkapnya
          <ChevronRight className="size-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-2xl font-black tracking-normal text-foreground">
            {getLocalizedText(classItem.name)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-base leading-8 text-muted-foreground">
          {getDescriptionBlocks(description).map(renderDescriptionBlock)}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ClassCard({ classItem }: { classItem: Class }) {
  const image = getClassImage(classItem)
  const name = getLocalizedText(classItem.name)
  const description = getLocalizedText(classItem.longDescription)
  const summary = getSummary(description)
  const price = classItem.discountPrice ?? classItem.price
  const detailPath = getClassDetailPath(classItem)
  const hasDiscount =
    typeof classItem.discountPrice === "number" &&
    classItem.discountPrice < classItem.price

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(15,23,42,0.14)]">
      <Link href={detailPath} className="relative block aspect-[2/1] w-full overflow-hidden bg-brand-mint md:aspect-[21/9]">
        {image ? (
          <img
            src={image}
            alt={classItem.images[0]?.alt || name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-mint text-primary">
            <BookOpenCheck className="size-12" />
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

            <div className="mt-1.5">
              {hasDiscount && (
                <p className="mb-1 text-sm font-medium text-slate-500 line-through">
                  {formatPrice(classItem.price)}
                </p>
              )}

              <p className="text-2xl font-black text-primary">
                {formatPrice(price)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {summary}
        </p>

        <div className="mt-3">
          <ClassDescriptionModal classItem={classItem} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pb-4">
          {classItem.totalSessions ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
              <CalendarDays className="size-3.5 text-primary" />
              {classItem.totalSessions} Sesi
            </span>
          ) : null}

          {classItem.sessionDurationMinutes ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
              <Clock className="size-3.5 text-primary" />
              {classItem.sessionDurationMinutes} Menit
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="size-3.5 text-primary" />
            {classItem.level || "Beginner"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            {classItem.type === "private" ? (
              <User className="size-3.5 text-primary" />
            ) : (
              <Users className="size-3.5 text-primary" />
            )}
            {classItem.type === "private" ? "Private" : "Grup"}
          </span>
        </div>

        <Link
          href={detailPath}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(11,135,65,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-green-strong hover:shadow-[0_14px_32px_rgba(11,135,65,0.3)]"
        >
          <BookOpenCheck className="size-4" />
          Detail Kelas
        </Link>
      </div>
    </article>
  )
}

export function AvailableClassesSection({ classes, variant = "home" }: AvailableClassesSectionProps) {
  const isPage = variant === "page"
  const Heading = isPage ? "h1" : "h2"
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!api) return

    const updateState = () => {
      setCount(api.scrollSnapList().length)
      setCurrent(api.selectedScrollSnap())
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    updateState()
    api.on("select", updateState)
    api.on("reInit", updateState)

    return () => {
      api.off("select", updateState)
      api.off("reInit", updateState)
    }
  }, [api])

  return (
    <section
      id="classes"
      className={
        isPage
          ? "bg-brand-surface px-6 pb-16 pt-28"
          : "relative overflow-hidden bg-brand-green-deep py-16"
      }
    >
      {!isPage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,255,80,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_34%)]" />
          <div className="absolute inset-0 bg-brand-green-deep/85" />
        </>
      )}

      <div className={isPage ? "relative z-10 mx-auto max-w-7xl" : "relative z-10 mx-auto max-w-7xl px-6"}>
        <div className={isPage ? "mx-auto mb-10 max-w-3xl text-center" : "mb-10 max-w-3xl"}>
          <Heading
            className={
              isPage
                ? "text-3xl font-black tracking-normal text-foreground md:text-5xl"
                : "text-3xl font-black tracking-normal text-white md:text-5xl"
            }
          >
            Kelas yang Tersedia
          </Heading>

          <p
            className={
              isPage
                ? "mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
                : "mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
            }
          >
            Pilih kelas yang sesuai minatmu dan mulai belajar sekarang.
          </p>
        </div>

        {classes.length > 0 ? (
          isPage ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          ) : (
            <div className="relative">
              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: classes.length > 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4 pb-2">
                  {classes.map((classItem) => (
                    <CarouselItem
                      key={classItem.id}
                      className="pl-4 basis-[88%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 flex"
                    >
                      <div className="w-full h-full">
                        <ClassCard classItem={classItem} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {/* Navigation controls & indicators */}
                <div className="mt-8 flex items-center justify-between sm:justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => api?.scrollPrev()}
                    disabled={!canScrollPrev}
                    className="size-10 rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/25 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    aria-label="Kelas Sebelumnya"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: count }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => api?.scrollTo(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                          current === index
                            ? "w-8 bg-brand-lime"
                            : "w-2.5 bg-white/30 hover:bg-white/50"
                        }`}
                        aria-label={`Ke slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => api?.scrollNext()}
                    disabled={!canScrollNext}
                    className="size-10 rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/25 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    aria-label="Kelas Berikutnya"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>
              </Carousel>
            </div>
          )
        ) : (
          <div className="rounded-[1.35rem] bg-white p-8 text-center shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-mint text-primary">
              <BookOpenCheck className="size-7" />
            </div>

            <h3 className="text-xl font-black text-foreground">Kelas baru segera hadir</h3>

            <p className="mx-auto mt-2 max-w-lg text-base leading-8 text-muted-foreground">
              Program kelas terbaru sedang kami siapkan untuk membantumu belajar bahasa dengan lebih percaya diri.
              Nantikan jadwal dan pilihan kelas berikutnya di halaman ini.
            </p>
          </div>
        )}

        {!isPage && classes.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 hover:scale-105 shadow-lg"
            >
              Lihat Semua Kelas
              <ChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
