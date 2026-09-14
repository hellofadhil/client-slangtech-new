import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  UsersRound,
} from "lucide-react"

import { Navigation } from "@/components/layout/navigation"
import { Badge } from "@/components/ui/badge"
import { ClassDetailActions } from "@/features/classes/components/class-detail-actions"
import { getClassBySlugOrId, type Class } from "@/features/classes/services/classes"

type ClassDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = "force-dynamic"

const typeLabel: Record<Class["type"], string> = {
  private: "Kelas Private",
  group: "Kelas Grup",
}

function getLocalizedText(text: Class["name"] | Class["longDescription"]) {
  return text.id || text.en || text.zh
}

function getClassImage(classItem: Class) {
  return classItem.coverImage || classItem.images[0]?.url || ""
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function getSelectedClassPrice(classItem: Class) {
  return classItem.discountPrice ?? classItem.price
}

function getDescriptionBlocks(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
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
    return "Jadwal akan dikonfirmasi setelah pendaftaran."
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

function getClassRegisterPath(classItem: Class) {
  return `/classes/${encodeURIComponent(classItem.slug || classItem.id)}/register`
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { slug } = await params
  const classItem = await getClassBySlugOrId(slug)

  if (!classItem) {
    notFound()
  }

  const name = getLocalizedText(classItem.name)
  const image = getClassImage(classItem)
  const selectedPrice = getSelectedClassPrice(classItem)
  const hasDiscount =
    typeof classItem.discountPrice === "number" && classItem.discountPrice < classItem.price
  const descriptionBlocks = getDescriptionBlocks(getLocalizedText(classItem.longDescription))

  return (
    <main className="min-h-screen bg-brand-surface">
      <Navigation />
      <section className="px-6 pb-16 pt-28 md:pt-32">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
              <div className="h-44 w-full overflow-hidden rounded-lg bg-brand-mint md:h-[138px] md:w-[220px]">
                {image ? (
                  <img src={image} alt={classItem.images[0]?.alt || name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary">
                    <BookOpenCheck className="size-12" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">
                  {typeLabel[classItem.type]}
                </Badge>
                <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                  {name}
                </h1>
                <div className="mt-3">
                  {hasDiscount && (
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {formatPrice(classItem.price)}
                    </p>
                  )}
                  <p className="text-2xl font-black text-primary">{formatPrice(selectedPrice)}</p>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {getProgramRangeText(classItem)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="size-5 text-primary" />
                    {classItem.sessionDurationMinutes} menit/sesi
                  </p>
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <UsersRound className="size-5 text-primary" />
                    {classItem.totalSessions} sesi
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-brand-green-strong"
              >
                <ArrowLeft className="size-4" />
                Kembali ke daftar kelas
              </Link>
              <h2 className="mt-4 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                Detail Kelas
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Cek detail program, durasi, dan lanjut daftar kalau kelas ini sudah cocok.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-brand-surface p-4">
              <h3 className="text-xl font-black tracking-normal text-foreground">Tentang Kelas</h3>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                {(descriptionBlocks.length > 0
                  ? descriptionBlocks
                  : ["Detail kelas akan segera tersedia."]
                ).map((block) => (
                  <p key={block}>{block}</p>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-brand-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black tracking-normal text-foreground">Info Program</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ringkasan durasi dan format kelas yang akan kamu ikuti.
                  </p>
                </div>
                <BookOpenCheck className="size-5 text-primary" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="text-sm font-bold text-muted-foreground">Total Program</p>
                  <p className="mt-2 text-lg font-black text-foreground">{classItem.totalSessions} sesi</p>
                </div>
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="text-sm font-bold text-muted-foreground">Per Sesi</p>
                  <p className="mt-2 text-lg font-black text-foreground">
                    {classItem.sessionDurationMinutes} menit
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="text-sm font-bold text-muted-foreground">Level</p>
                  <p className="mt-2 text-lg font-black text-foreground">
                    {classItem.level || "All levels"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-bold text-muted-foreground">Harga Kelas</p>
                <div className="mt-2">
                  {hasDiscount && (
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {formatPrice(classItem.price)}
                    </p>
                  )}
                  <p className="text-3xl font-black text-primary">{formatPrice(selectedPrice)}</p>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    Data pendaftaran tersimpan di dashboard.
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    Jadwal kelas akan muncul setelah dikonfirmasi admin.
                  </p>
                </div>
              </div>
              <ClassDetailActions
                classItem={classItem}
                registerPath={getClassRegisterPath(classItem)}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
