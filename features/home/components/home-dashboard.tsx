"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  FileUp,
  Home as HomeIcon,
  MapPin,
  MessageSquare,
  RefreshCcw,
  RotateCcw,
  Ticket,
  UserRound,
  Video,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { emptyProfileInput, ProfileForm } from "@/features/auth/components/profile-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingCard, Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createAuthRedirectPath } from "@/features/auth/services/auth-redirect"
import {
  getUserEnrollmentOverview,
  manualPaymentAccount,
  requestEnrollmentReschedule,
  submitEventSessionAttendance,
  type ClassEnrollment,
  type EnrollmentScheduleSession,
  type EnrollmentStatus,
  type EventEnrollment,
  type EventEnrollmentPaymentStatus,
  type RescheduleRequestStatus,
} from "@/features/enrollments/services/enrollments"
import {
  getUserProfile,
  getValidSession,
  isProfileComplete,
  saveUserProfile,
  type UserProfile,
  type UserProfileInput,
  type UserSession,
} from "@/features/auth/services/firebase-auth"
import { cn } from "@/lib/utils"

type GuardState = "checking" | "redirecting" | "ready"
type DashboardView = "home" | "payments" | "classes" | "events" | "profile"
const MAX_UPLOAD_FILE_SIZE = Math.floor(1.5 * 1024 * 1024)
type DashboardEnrollment = ClassEnrollment | EventEnrollment

const ENROLLMENT_ACTIVE_TAB_REFRESH_THROTTLE_MS = 2_000

const studentNavItems = [
  {
    id: "home" as const,
    label: "Home",
    description: "Dashboard",
    icon: HomeIcon,
  },
  {
    id: "payments" as const,
    label: "Payment",
    description: "Status pembayaran",
    icon: Wallet,
  },
  {
    id: "classes" as const,
    label: "Class",
    description: "Kelas aktif",
    icon: BookOpen,
  },
  {
    id: "events" as const,
    label: "Event",
    description: "Event saya",
    icon: CalendarClock,
  },
  {
    id: "profile" as const,
    label: "Profile",
    description: "Akun learner",
    icon: UserRound,
  },
] as const satisfies ReadonlyArray<{
  id: DashboardView
  label: string
  description: string
  icon: typeof HomeIcon
}>

const teacherNavItems = [
  {
    id: "home" as const,
    label: "Overview",
    description: "Jadwal Terdekat",
    icon: HomeIcon,
  },
  {
    id: "classes" as const,
    label: "Jadwal Mengajar",
    description: "Jadwal dari Admin",
    icon: CalendarClock,
  },
  {
    id: "profile" as const,
    label: "Profil Guru",
    description: "Informasi pengajar",
    icon: UserRound,
  },
] as const satisfies ReadonlyArray<{
  id: DashboardView
  label: string
  description: string
  icon: typeof HomeIcon
}>

function getNavItems(isTeacher?: boolean) {
  return isTeacher ? teacherNavItems : studentNavItems
}

const enrollmentStatusMeta: Record<
  EnrollmentStatus,
  {
    label: string
    className: string
  }
> = {
  waiting_payment_confirmation: {
    label: "Menunggu pembayaran",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "Aktif",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  completed: {
    label: "Selesai",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
}

const eventEnrollmentStatusMeta: Record<
  EventEnrollment["status"],
  {
    label: string
    className: string
  }
> = {
  registered: {
    label: "Terdaftar",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  waiting_payment_confirmation: {
    label: "Menunggu pembayaran",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "Terkonfirmasi",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  completed: {
    label: "Selesai",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
}

const paymentStatusMeta: Record<
  EventEnrollmentPaymentStatus,
  {
    label: string
    className: string
  }
> = {
  not_required: {
    label: "Gratis",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  waiting_confirmation: {
    label: "Menunggu konfirmasi",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  pending: {
    label: "Pending gateway",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  paid: {
    label: "Lunas",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  failed: {
    label: "Gagal",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  expired: {
    label: "Expired",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
}

const rescheduleStatusMeta: Record<
  RescheduleRequestStatus,
  {
    label: string
    className: string
  }
> = {
  pending_admin_approval: {
    label: "Menunggu approve admin",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "Disetujui",
    className: "border-primary/20 bg-brand-mint text-primary",
  },
  rejected: {
    label: "Ditolak",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
}

function isEventEnrollment(enrollment: DashboardEnrollment): enrollment is EventEnrollment {
  return "eventSnapshot" in enrollment
}

function formatPrice(value: number) {
  if (value <= 0) {
    return "Gratis"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatScheduleDate(value: string, timezone = "Asia/Jakarta") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date)
}

function formatScheduleDay(value: string, timezone = "Asia/Jakarta") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date)
}

function formatScheduleTime(value: string, timezone = "Asia/Jakarta") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date)
}

function getAttendanceWindow(value: string) {
  const startsAt = new Date(value)

  if (Number.isNaN(startsAt.getTime())) {
    return {
      isOpen: false,
      reason: "Jadwal sesi belum valid.",
      closesAt: null,
    }
  }

  const now = Date.now()
  const startsAtTime = startsAt.getTime()
  const closesAt = new Date(startsAtTime + 3 * 24 * 60 * 60 * 1000)

  if (now < startsAtTime) {
    return {
      isOpen: false,
      reason: "Absensi belum dibuka. Absensi bisa dilakukan pada hari sesi dimulai.",
      closesAt,
    }
  }

  if (now > closesAt.getTime()) {
    return {
      isOpen: false,
      reason: "Periode absensi sesi ini sudah ditutup.",
      closesAt,
    }
  }

  return {
    isOpen: true,
    reason: "",
    closesAt,
  }
}

function toIsoDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function getNextSession(sessions: EnrollmentScheduleSession[]) {
  const now = Date.now()
  const activeSessions = sessions
    .filter((session) => session.status !== "cancelled" && session.status !== "completed")
    .sort((firstSession, secondSession) => {
      return new Date(firstSession.startsAt).getTime() - new Date(secondSession.startsAt).getTime()
    })

  return (
    activeSessions.find((session) => new Date(session.startsAt).getTime() >= now) ??
    activeSessions[0] ??
    null
  )
}

function getFirstName(profile: UserProfile | null, session: UserSession | null) {
  const fallback = profile?.role === "teacher" ? "Guru" : "Learner"
  const displayName = profile?.nickname || profile?.fullName || session?.displayName || session?.email || fallback
  return displayName.split(" ")[0]
}

function getPaymentMethodLabel(enrollment: DashboardEnrollment) {
  if (enrollment.payment.method === "free") {
    return "Gratis"
  }

  return enrollment.payment.method === "manual" ? "Manual Payment" : "Payment Gateway"
}

function getPaymentDescription(status: EventEnrollmentPaymentStatus) {
  if (status === "not_required") {
    return "Program ini tidak membutuhkan pembayaran."
  }

  if (status === "paid") {
    return "Pembayaran sudah dikonfirmasi oleh admin."
  }

  if (status === "waiting_confirmation" || status === "pending") {
    return "Admin sedang memverifikasi pembayaran kamu."
  }

  if (status === "failed") {
    return "Pembayaran belum berhasil diverifikasi."
  }

  return "Batas waktu pembayaran sudah berakhir."
}

function getPaymentReferenceDate(enrollment: DashboardEnrollment) {
  if (enrollment.payment.method === "free") {
    return enrollment.createdAt || enrollment.updatedAt
  }

  if (enrollment.payment.method === "manual") {
    return enrollment.payment.manual.uploadedAt || enrollment.updatedAt
  }

  return enrollment.updatedAt
}

function getEnrollmentDisplayName(enrollment: DashboardEnrollment) {
  return isEventEnrollment(enrollment)
    ? enrollment.eventSnapshot.displayName
    : enrollment.classSnapshot.displayName
}

function getEnrollmentSelectedPrice(enrollment: DashboardEnrollment) {
  return isEventEnrollment(enrollment)
    ? enrollment.eventSnapshot.selectedPrice
    : enrollment.classSnapshot.selectedPrice
}

function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <Badge variant="outline" className={cn("border text-sm hover:bg-transparent", className)}>
      {label}
    </Badge>
  )
}

function DashboardRefreshButton({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean
  onRefresh: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-label="Refresh data dashboard"
      title="Refresh data"
      className="size-10 shrink-0"
    >
      {isRefreshing ? <Spinner /> : <RefreshCcw className="size-4" />}
    </Button>
  )
}

function EmptyDashboard({ isTeacher }: { isTeacher?: boolean } = {}) {
  if (isTeacher) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-primary shadow-xs">
              <CalendarClock className="size-6" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                Portal Pengajar Resmi
              </div>
              <h2 className="text-xl font-black tracking-normal text-foreground sm:text-2xl">
                Belum Ada Jadwal Mengajar yang Ditugaskan
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Jadwal sesi mengajar Anda diatur dan diberikan langsung oleh Admin LKP SlangTech. Begitu admin menetapkan jadwal kelas untuk Anda, detail pertemuan dan link kelas online akan otomatis muncul di sini.
              </p>
              <div className="pt-2">
                <a
                  href="https://api.whatsapp.com/send/?phone=6282122210770&text=Halo%20Admin%20SlangTech,%20saya%20guru%20SlangTech%20ingin%20koordinasi%20mengenai%20jadwal%20mengajar."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageSquare className="size-4" />
                  Hubungi Admin via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-white via-brand-surface/40 to-brand-mint/20 p-6 shadow-sm transition sm:p-8">
      {/* Decorative background circle */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-brand-mint/40 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Siap Tingkatkan Bahasamu?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Kamu belum memiliki kelas atau event aktif. Pilih kelas bahasa Mandarin, Cantonese, English, atau Japanese bersama tutor berpengalaman sekarang.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-bold text-foreground/80 sm:grid-cols-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white/80 p-2">
              <Check className="size-3.5 text-primary" />
              <span>Jadwal Fleksibel</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white/80 p-2">
              <Check className="size-3.5 text-primary" />
              <span>Tutor Native / Pro</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-white/80 p-2">
              <Check className="size-3.5 text-primary" />
              <span>Sertifikat Resmi</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col shrink-0">
          <Button asChild className="h-11 px-6 font-bold shadow-md shadow-primary/20">
            <Link href="/classes">
              Lihat Pilihan Kelas
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-6 font-bold bg-white hover:bg-brand-mint">
            <Link href="/events">
              Jelajahi Event
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function EnrollmentSelector({
  enrollments,
  selectedEnrollmentId,
  onSelect,
}: {
  enrollments: ClassEnrollment[]
  selectedEnrollmentId: string
  onSelect: (enrollmentId: string) => void
}) {
  if (enrollments.length <= 1) {
    return null
  }

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <Field>
        <FieldLabel htmlFor="activeEnrollment">Kelas Aktif</FieldLabel>
        <select
          id="activeEnrollment"
          value={selectedEnrollmentId}
          onChange={(event) => onSelect(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50"
        >
          {enrollments.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.id}>
              {enrollment.classSnapshot.displayName}
            </option>
          ))}
        </select>
      </Field>
    </section>
  )
}

function getGoogleCalendarUrl({
  title,
  description,
  startsAt,
  endsAt,
  meetingUrl,
}: {
  title: string
  description: string
  startsAt: string
  endsAt: string
  meetingUrl?: string
}) {
  const formatGCalDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  }

  const start = formatGCalDate(startsAt)
  const end = endsAt ? formatGCalDate(endsAt) : start
  const details = meetingUrl
    ? `${description}\n\nLink Pertemuan: ${meetingUrl}`
    : description

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    location: meetingUrl || "Online Class",
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function SessionCountdown({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    text: string
    isLive: boolean
    isPast: boolean
  }>({ text: "", isLive: false, isPast: false })

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now()
      const start = new Date(startsAt).getTime()
      const end = endsAt ? new Date(endsAt).getTime() : start + 60 * 60 * 1000

      if (now >= start && now <= end) {
        setTimeLeft({ text: "Sesi Sedang Berlangsung!", isLive: true, isPast: false })
        return
      }

      if (now > end) {
        setTimeLeft({ text: "Sesi Selesai", isLive: false, isPast: true })
        return
      }

      const diff = start - now
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeLeft({
          text: `Mulai dalam ${days} hari ${hours} jam lagi`,
          isLive: false,
          isPast: false,
        })
      } else if (hours > 0) {
        setTimeLeft({
          text: `Mulai dalam ${hours} jam ${minutes} menit lagi`,
          isLive: false,
          isPast: false,
        })
      } else {
        setTimeLeft({
          text: `Mulai dalam ${Math.max(1, minutes)} menit lagi`,
          isLive: minutes <= 15,
          isPast: false,
        })
      }
    }

    calculateTime()
    const timer = setInterval(calculateTime, 30_000)
    return () => clearInterval(timer)
  }, [startsAt, endsAt])

  if (!timeLeft.text || timeLeft.isPast) {
    return null
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-all",
        timeLeft.isLive
          ? "border border-emerald-300 bg-emerald-50 text-emerald-700 animate-pulse"
          : "border border-primary/20 bg-brand-mint/60 text-primary"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          timeLeft.isLive ? "bg-emerald-600 animate-ping" : "bg-primary"
        )}
      />
      <Clock className="size-3.5" />
      <span>{timeLeft.text}</span>
    </div>
  )
}

function NextSchedulePanel({
  enrollment,
  isTeacher,
  profile,
}: {
  enrollment: ClassEnrollment
  isTeacher?: boolean
  profile?: UserProfile | null
}) {
  const sessions = enrollment.schedule?.sessions ?? []
  const teacherSessions = isTeacher && profile
    ? sessions.filter(
        (s) =>
          (profile.uid && s.teacherId === profile.uid) ||
          (profile.fullName && s.teacherName?.toLowerCase() === profile.fullName.toLowerCase()) ||
          (profile.nickname && s.teacherName?.toLowerCase() === profile.nickname.toLowerCase())
      )
    : sessions
  const effectiveSessions = isTeacher && teacherSessions.length > 0 ? teacherSessions : sessions
  const nextSession = getNextSession(effectiveSessions)
  const enrollmentMeta = enrollmentStatusMeta[enrollment.status]

  const calendarUrl = nextSession
    ? getGoogleCalendarUrl({
        title: `${enrollment.classSnapshot.displayName} - ${nextSession.title || `Sesi ${nextSession.sessionNumber}`}`,
        description: `Kelas bahasa LKP SlangTech bersama ${nextSession.teacherName || "Tutor"}`,
        startsAt: nextSession.startsAt,
        endsAt: nextSession.endsAt,
        meetingUrl: nextSession.meetingUrl,
      })
    : null

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      {/* Accent gradient line */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-brand-lime to-primary" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
              <CalendarCheck2 className="size-4" />
              Kelas Berikutnya
            </p>
            {nextSession && (
              <SessionCountdown startsAt={nextSession.startsAt} endsAt={nextSession.endsAt} />
            )}
          </div>
          <h2 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            {nextSession?.title || (nextSession ? `Sesi ${nextSession.sessionNumber}` : enrollment.classSnapshot.displayName)}
          </h2>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            {enrollment.classSnapshot.displayName}
          </p>
        </div>
        <StatusBadge label={enrollmentMeta.label} className={enrollmentMeta.className} />
      </div>

      {nextSession ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-brand-surface/60 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hari & Tanggal</p>
              <p className="mt-1 text-base font-black text-foreground">
                {formatScheduleDay(nextSession.startsAt, nextSession.timezone)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-brand-surface/60 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jam Belajar</p>
              <p className="mt-1 text-base font-black text-foreground">
                {formatScheduleTime(nextSession.startsAt, nextSession.timezone)}
                {" - "}
                {formatScheduleTime(nextSession.endsAt, nextSession.timezone)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-brand-surface/60 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isTeacher ? "Peserta / Siswa" : "Tutor"}
              </p>
              <p className="mt-1 text-base font-black text-foreground truncate">
                {isTeacher
                  ? (enrollment.studentSnapshot?.fullName || "Siswa SlangTech")
                  : (nextSession.teacherName || "Teacher LKP SlangTech")}
              </p>
            </div>
          </div>

          <div className="grid gap-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {nextSession.locationType === "online" ? (
                  <Video className="size-3.5 text-primary" />
                ) : (
                  <MapPin className="size-3.5 text-primary" />
                )}
                {nextSession.locationLabel || (nextSession.locationType === "online" ? "Online Class" : "Offline Class")}
              </span>
              {calendarUrl && (
                <Link
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <CalendarPlus className="size-3.5" />
                  + Google Cal
                </Link>
              )}
            </div>

            {nextSession.meetingUrl ? (
              <Button asChild className="h-12 w-full bg-brand-green-deep text-sm font-black uppercase tracking-wider hover:bg-brand-green-deep/90 shadow-sm">
                <Link href={nextSession.meetingUrl} target="_blank" rel="noreferrer">
                  Masuk Kelas Sekarang
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button type="button" disabled className="h-12 w-full text-sm font-black uppercase">
                Link Belum Tersedia
              </Button>
            )}
          </div>
        </div>
      ) : isTeacher ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-brand-mint/40 p-4 text-primary">
          <CalendarClock className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Jadwal Sesi Sedang Disusun oleh Admin</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Admin LKP SlangTech sedang memproses penetapan tanggal dan link kelas untuk program ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              {enrollment.payment.status === "paid"
                ? "Pembayaran lunas, jadwal sedang disusun admin."
                : "Jadwal akan muncul setelah pembayaran dikonfirmasi admin."}
            </p>
            <p className="mt-1 text-sm leading-6">
              Status ini otomatis berubah saat admin mengisi sesi belajar di data enrollment.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function ScheduleList({
  enrollment,
  isTeacher,
  profile,
}: {
  enrollment: ClassEnrollment
  isTeacher?: boolean
  profile?: UserProfile | null
}) {
  const allSessions = enrollment.schedule?.sessions ?? []
  const teacherSessions = isTeacher && profile
    ? allSessions.filter(
        (s) =>
          (profile.uid && s.teacherId === profile.uid) ||
          (profile.fullName && s.teacherName?.toLowerCase() === profile.fullName.toLowerCase()) ||
          (profile.nickname && s.teacherName?.toLowerCase() === profile.nickname.toLowerCase())
      )
    : allSessions
  const sessions = isTeacher && teacherSessions.length > 0 ? teacherSessions : allSessions

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-normal text-foreground">{isTeacher ? "Daftar Jadwal Mengajar" : "Daftar Jadwal"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} dari {enrollment.classSnapshot.totalSessions || sessions.length} sesi
          </p>
        </div>
        <CalendarClock className="size-5 text-primary" />
      </div>

      <div className="mt-5 grid gap-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="grid gap-3 rounded-lg border border-border bg-brand-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border bg-white text-foreground">
                    Sesi {session.sessionNumber || "-"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border text-sm",
                      session.status === "completed" && "border-slate-200 bg-slate-50 text-slate-700",
                      session.status === "cancelled" && "border-red-200 bg-red-50 text-red-700",
                      session.status !== "completed" &&
                        session.status !== "cancelled" &&
                        "border-primary/20 bg-brand-mint text-primary",
                    )}
                  >
                    {session.status}
                  </Badge>
                </div>
                <h3 className="mt-3 text-sm font-black text-foreground">
                  {session.title || `Sesi ${session.sessionNumber}`}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {formatScheduleDate(session.startsAt, session.timezone)}
                </p>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <p className="font-bold text-foreground">
                  {formatScheduleTime(session.startsAt, session.timezone)}
                  {" - "}
                  {formatScheduleTime(session.endsAt, session.timezone)}
                </p>
                <p className="mt-1">{isTeacher ? (enrollment.studentSnapshot?.fullName ? `Siswa: ${enrollment.studentSnapshot.fullName}` : "Peserta SlangTech") : (session.teacherName || "Teacher LKP SlangTech")}</p>
                {session.meetingUrl && (
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Video className="size-3" />
                    Buka Link Kelas
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-brand-surface p-5 text-sm leading-7 text-muted-foreground">
            {isTeacher
              ? "Jadwal sesi mengajar belum tersedia. Admin akan menetapkan jadwal untuk kelas ini."
              : "Jadwal belum tersedia."}
          </div>
        )}
      </div>
    </section>
  )
}

function TeacherScheduleCoordinationPanel({
  enrollment,
  profile,
}: {
  enrollment: ClassEnrollment
  profile: UserProfile | null
}) {
  const teacherName = profile?.fullName || profile?.nickname || "Pengajar"
  const className = enrollment.classSnapshot?.displayName || "Kelas Bahasa"

  return (
    <section className="rounded-lg border border-border bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-normal text-foreground">
            Koordinasi Jadwal Mengajar
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Jadwal kelas diberikan & dikelola oleh Admin
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand-mint text-primary">
          <CalendarClock className="size-5" />
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-brand-surface p-4 text-xs sm:text-sm text-muted-foreground space-y-2.5">
        <p className="font-bold text-foreground">Ketentuan Jadwal Pengajar:</p>
        <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-xs">
          <li>Seluruh jadwal sesi dan link meeting kelas diberikan langsung oleh Admin LKP SlangTech.</li>
          <li>Pengajar tidak dapat mengajukan reschedule sepihak tanpa koordinasi admin.</li>
          <li>Jika berhalangan hadir atau ada kendala teknis, mohon segera hubungi admin minimal 24 jam sebelum sesi berlangsung.</li>
        </ul>
      </div>

      <div className="pt-2">
        <a
          href={`https://api.whatsapp.com/send/?phone=6282122210770&text=${encodeURIComponent(
            `Halo Admin SlangTech, saya ${teacherName} ingin koordinasi terkait jadwal mengajar kelas ${className}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#20bd5a] transition-colors"
        >
          <MessageSquare className="size-4" />
          Hubungi Admin via WhatsApp
        </a>
      </div>
    </section>
  )
}

function ReschedulePanel({
  enrollment,
  session,
  onSubmitted,
}: {
  enrollment: ClassEnrollment
  session: UserSession | null
  onSubmitted: () => Promise<void>
}) {
  const sessions = useMemo(() => enrollment.schedule?.sessions ?? [], [enrollment.schedule?.sessions])
  const nextSession = useMemo(() => getNextSession(sessions), [sessions])
  const firstSessionId = sessions[0]?.id
  const currentRequest = enrollment.schedule?.rescheduleRequest
  const [targetSessionId, setTargetSessionId] = useState(nextSession?.id ?? sessions[0]?.id ?? "")
  const [preferredDateTime, setPreferredDateTime] = useState("")
  const [backupDateTime, setBackupDateTime] = useState("")
  const [reason, setReason] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setTargetSessionId(nextSession?.id ?? sessions[0]?.id ?? "")
    setPreferredDateTime("")
    setBackupDateTime("")
    setReason("")
    setErrorMessage("")
    setSuccessMessage("")
  }, [enrollment.id, nextSession?.id, firstSessionId])

  const hasPendingRequest = currentRequest?.status === "pending_admin_approval"
  const canRequest = sessions.length > 0 && !hasPendingRequest && enrollment.status !== "cancelled"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!session) {
      setErrorMessage("Sesi login tidak ditemukan.")
      return
    }

    const primarySlot = toIsoDateTime(preferredDateTime)
    const backupSlot = toIsoDateTime(backupDateTime)
    const preferredSlots = [
      primarySlot ? { startsAt: primarySlot, note: "Opsi utama" } : null,
      backupSlot ? { startsAt: backupSlot, note: "Opsi cadangan" } : null,
    ].filter((slot): slot is { startsAt: string; note: string } => slot !== null)

    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      await requestEnrollmentReschedule(session, {
        enrollmentId: enrollment.id,
        targetSessionId,
        reason,
        preferredSlots,
      })
      setSuccessMessage("Request reschedule sudah dikirim dan menunggu approve admin.")
      await onSubmitted()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Request reschedule belum berhasil dikirim.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-normal text-foreground">Request Reschedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approval akan diproses admin</p>
        </div>
        <RotateCcw className="size-5 text-primary" />
      </div>

      {currentRequest && (
        <div className="mt-5 rounded-lg border border-border bg-brand-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">Request terakhir</p>
            <StatusBadge
              label={rescheduleStatusMeta[currentRequest.status].label}
              className={rescheduleStatusMeta[currentRequest.status].className}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentRequest.reason}</p>
          {currentRequest.preferredSlots.length > 0 && (
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              {currentRequest.preferredSlots.map((slot) => (
                <p key={slot.startsAt}>
                  {slot.note ? `${slot.note}: ` : ""}
                  {formatScheduleDate(slot.startsAt, slot.timezone)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <FieldGroup>
          {errorMessage && <FieldError>{errorMessage}</FieldError>}
          {successMessage && (
            <div className="rounded-md border border-primary/20 bg-brand-mint px-3 py-2 text-sm font-medium text-primary">
              {successMessage}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="targetSession">Sesi yang Diubah</FieldLabel>
            <select
              id="targetSession"
              value={targetSessionId}
              onChange={(event) => setTargetSessionId(event.target.value)}
              disabled={!canRequest || isSubmitting}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              required
            >
              {sessions.map((scheduleSession) => (
                <option key={scheduleSession.id} value={scheduleSession.id}>
                  Sesi {scheduleSession.sessionNumber} - {formatScheduleDate(scheduleSession.startsAt, scheduleSession.timezone)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="preferredDateTime">Opsi Jadwal Utama</FieldLabel>
              <Input
                id="preferredDateTime"
                type="datetime-local"
                value={preferredDateTime}
                onChange={(event) => setPreferredDateTime(event.target.value)}
                disabled={!canRequest || isSubmitting}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="backupDateTime">Opsi Cadangan</FieldLabel>
              <Input
                id="backupDateTime"
                type="datetime-local"
                value={backupDateTime}
                onChange={(event) => setBackupDateTime(event.target.value)}
                disabled={!canRequest || isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="rescheduleReason">Alasan</FieldLabel>
            <Textarea
              id="rescheduleReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: Ada jadwal kampus/kerja di jam tersebut."
              className="min-h-28"
              disabled={!canRequest || isSubmitting}
              required
            />
            <FieldDescription>
              Admin akan mengecek ketersediaan teacher sebelum menyetujui jadwal baru.
            </FieldDescription>
          </Field>

          <Button type="submit" disabled={!canRequest || isSubmitting} className="w-full">
            {isSubmitting ? <Spinner /> : <RefreshCcw className="size-4" />}
            {hasPendingRequest ? "Menunggu Approval Admin" : "Kirim Request Reschedule"}
          </Button>
        </FieldGroup>
      </form>
    </section>
  )
}

function CopyAccountButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-white px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-brand-mint active:scale-95"
      title="Salin nomor rekening"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      <span>{copied ? "Tersalin!" : "Salin Rekening"}</span>
    </button>
  )
}

function PaymentPanel({ enrollment }: { enrollment: DashboardEnrollment }) {
  const paymentMeta = paymentStatusMeta[enrollment.payment.status]
  const paymentDate = getPaymentReferenceDate(enrollment)
  const displayName = getEnrollmentDisplayName(enrollment)
  const selectedPrice = getEnrollmentSelectedPrice(enrollment)
  const isUnpaidOrPending =
    enrollment.payment.status === "unpaid" ||
    enrollment.payment.status === "pending" ||
    enrollment.payment.status === "waiting_confirmation"

  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-mint text-primary">
            {enrollment.payment.status === "paid" ? (
              <CheckCircle2 className="size-5" />
            ) : enrollment.payment.method === "free" ? (
              <Ticket className="size-5" />
            ) : enrollment.payment.method === "manual" ? (
              <Banknote className="size-5" />
            ) : (
              <CreditCard className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="break-words text-base font-black leading-6 text-foreground">
              {displayName}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {getPaymentDescription(enrollment.payment.status)}
            </p>
          </div>
        </div>
        <div className="shrink-0 sm:pt-1">
          <StatusBadge label={paymentMeta.label} className={paymentMeta.className} />
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Pembayaran</p>
            <p className="mt-1 text-2xl font-black tracking-normal text-foreground">
              {formatPrice(enrollment.payment.amount || selectedPrice)}
            </p>
          </div>
          {isUnpaidOrPending && enrollment.payment.method === "manual" && (
            <CopyAccountButton text={manualPaymentAccount.accountNumber} />
          )}
        </div>

        {isUnpaidOrPending && enrollment.payment.method === "manual" && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-brand-mint/40 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground">{manualPaymentAccount.bankName}</p>
                <p className="mt-0.5 text-base font-black tracking-wide text-foreground">
                  {manualPaymentAccount.accountNumber}
                </p>
                <p className="text-xs text-muted-foreground">a.n. {manualPaymentAccount.accountHolderName}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-brand-surface px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal</p>
            <p className="mt-1 break-words text-sm font-black text-foreground">{formatScheduleDay(paymentDate)}</p>
          </div>

          <div className="rounded-lg border border-border bg-brand-surface px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metode</p>
            <p className="mt-1 break-words text-sm font-black text-foreground">{getPaymentMethodLabel(enrollment)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function getActiveClassEnrollments(enrollments: ClassEnrollment[]) {
  return enrollments.filter((enrollment) => enrollment.status === "confirmed")
}

function DashboardSidebarNav({
  activeView,
  onChange,
  profile,
  session,
  isTeacher,
}: {
  activeView: DashboardView
  onChange: (view: DashboardView) => void
  profile: UserProfile | null
  session: UserSession | null
  isTeacher?: boolean
}) {
  const navItems = getNavItems(isTeacher)
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 space-y-4 rounded-lg border border-border bg-white p-4 shadow-sm">
        <nav aria-label="Dashboard navigation" className="grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === activeView

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-brand-mint hover:text-primary",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-black">{item.label}</span>
                  <span
                    className={cn(
                      "block text-sm",
                      isActive ? "text-white/75" : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

function DashboardBottomNav({
  activeView,
  onChange,
  isTeacher,
}: {
  activeView: DashboardView
  onChange: (view: DashboardView) => void
  isTeacher?: boolean
}) {
  const navItems = getNavItems(isTeacher)
  return (
    <nav
      aria-label="Dashboard navigation"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 pointer-events-none lg:hidden"
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(7,95,56,0.12)] backdrop-blur-xl pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeView

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive
                  ? "bg-brand-mint text-primary font-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-brand-surface/80",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isActive ? "scale-110 text-primary" : "text-muted-foreground"
                  )}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[11px] font-bold leading-none tracking-tight transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function DashboardHomeView({
  selectedEnrollment,
  enrollments,
  profile,
  session,
  isTeacher,
  onOpenClasses,
  refreshButton,
}: {
  selectedEnrollment: ClassEnrollment | null
  enrollments: ClassEnrollment[]
  profile: UserProfile | null
  session: UserSession | null
  isTeacher?: boolean
  onOpenClasses: () => void
  refreshButton: ReactNode
}) {
  const activeClassCount = getActiveClassEnrollments(enrollments).length
  const nextSession = selectedEnrollment
    ? getNextSession(selectedEnrollment.schedule?.sessions ?? [])
    : null
  const nextSessionSummary = isTeacher
    ? (nextSession
        ? `Jadwal mengajar berikutnya: ${nextSession.title || `Sesi ${nextSession.sessionNumber}`} - ${formatScheduleDay(
            nextSession.startsAt,
            nextSession.timezone,
          )}, ${formatScheduleTime(nextSession.startsAt, nextSession.timezone)}`
        : "Jadwal sesi mengajar akan muncul di sini setelah diberikan oleh Admin LKP SlangTech.")
    : (nextSession
        ? `${nextSession.title || `Sesi ${nextSession.sessionNumber}`} - ${formatScheduleDay(
            nextSession.startsAt,
            nextSession.timezone,
          )}, ${formatScheduleTime(nextSession.startsAt, nextSession.timezone)}`
        : "Jadwal kelas kamu akan muncul di sini begitu admin mengatur sesi.")

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Halo, {isTeacher ? `Guru ${getFirstName(profile, session)}` : getFirstName(profile, session)}
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
            {nextSessionSummary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {refreshButton}
          <Button type="button" variant="outline" onClick={onOpenClasses} className="hidden sm:inline-flex">
            {isTeacher ? "Jadwal Mengajar" : "Kelas Saya"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {selectedEnrollment ? (
        <NextSchedulePanel enrollment={selectedEnrollment} isTeacher={isTeacher} profile={profile} />
      ) : (
        <EmptyDashboard isTeacher={isTeacher} />
      )}

      {selectedEnrollment && (
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-muted-foreground">{isTeacher ? "Jadwal Mengajar" : "Kelas Saya"}</p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-foreground">
                {activeClassCount} {isTeacher ? "Kelas Terjadwal" : "Kelas Aktif"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Program: <strong className="text-foreground">{selectedEnrollment.classSnapshot.displayName}</strong>
                {isTeacher && selectedEnrollment.studentSnapshot?.fullName ? ` • Siswa: ${selectedEnrollment.studentSnapshot.fullName}` : ""}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-surface text-foreground">
              <BookOpen className="size-5" />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onOpenClasses} className="mt-6 h-11 w-full">
            {isTeacher ? "Lihat Seluruh Jadwal Mengajar" : "Lihat Detail Kelas"}
            <ArrowRight className="size-4" />
          </Button>
        </section>
      )}
    </div>
  )
}

function PaymentsView({
  enrollments,
  refreshButton,
}: {
  enrollments: DashboardEnrollment[]
  refreshButton: ReactNode
}) {
  const itemsPerPage = 6
  const [currentPage, setCurrentPage] = useState(1)
  const paymentHistory = [...enrollments].sort((firstEnrollment, secondEnrollment) => {
    const firstDate = new Date(getPaymentReferenceDate(firstEnrollment)).getTime()
    const secondDate = new Date(getPaymentReferenceDate(secondEnrollment)).getTime()

    return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate)
  })
  const totalPages = Math.max(1, Math.ceil(paymentHistory.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPayments = paymentHistory.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [enrollments.length])

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Riwayat Payment
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
            Semua pembayaran terakhir dari pendaftaran kelas dan event kamu.
          </p>
        </div>
        {refreshButton}
      </header>

      {paymentHistory.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <div className="grid gap-4">
          {paginatedPayments.map((enrollment) => (
            <PaymentPanel key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Halaman {safeCurrentPage} dari {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Sebelumnya
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ClassListView({
  enrollments,
  onOpenDetail,
  isTeacher,
  profile,
}: {
  enrollments: ClassEnrollment[]
  onOpenDetail: (enrollmentId: string) => void
  isTeacher?: boolean
  profile?: UserProfile | null
}) {
  if (enrollments.length === 0) {
    return <EmptyDashboard isTeacher={isTeacher} />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {enrollments.map((enrollment) => {
        const sessions = enrollment.schedule?.sessions ?? []
        const teacherSessions = isTeacher && profile
          ? sessions.filter(
              (s) =>
                (profile.uid && s.teacherId === profile.uid) ||
                (profile.fullName && s.teacherName?.toLowerCase() === profile.fullName.toLowerCase()) ||
                (profile.nickname && s.teacherName?.toLowerCase() === profile.nickname.toLowerCase())
            )
          : sessions
        const effectiveSessions = isTeacher && teacherSessions.length > 0 ? teacherSessions : sessions
        const nextSession = getNextSession(effectiveSessions)
        const enrollmentMeta = enrollmentStatusMeta[enrollment.status]

        return (
          <section key={enrollment.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-normal text-foreground">
                  {enrollment.classSnapshot.displayName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Level: {enrollment.classSnapshot.level || "All levels"}
                </p>
              </div>
              <StatusBadge label={enrollmentMeta.label} className={enrollmentMeta.className} />
            </div>

            <div className="mt-5 grid gap-3 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-muted-foreground">Progress</span>
                <span className="font-black text-foreground">
                  {sessions.length} / {enrollment.classSnapshot.totalSessions || sessions.length} sesi
                </span>
              </div>
              {nextSession ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-muted-foreground">
                      Sesi {nextSession.sessionNumber || "-"}
                    </span>
                    <span className="font-black text-foreground">
                      {formatScheduleTime(nextSession.startsAt, nextSession.timezone)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {formatScheduleDay(nextSession.startsAt, nextSession.timezone)}
                    {isTeacher
                      ? (enrollment.studentSnapshot?.fullName ? ` - Siswa: ${enrollment.studentSnapshot.fullName}` : "")
                      : (nextSession.teacherName ? ` - Tutor: ${nextSession.teacherName}` : "")
                    }
                  </p>
                </>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">Jadwal belum tersedia.</p>
              )}
            </div>

            <Button type="button" onClick={() => onOpenDetail(enrollment.id)} className="mt-5 h-11 w-full">
              {isTeacher ? "Lihat Jadwal Sesi" : "Detail Kelas"}
              <ArrowRight className="size-4" />
            </Button>
          </section>
        )
      })}
    </div>
  )
}

function ClassesView({
  enrollments,
  detailEnrollment,
  session,
  isTeacher,
  profile,
  onOpenDetail,
  onBackToList,
  onSubmitted,
  refreshButton,
}: {
  enrollments: ClassEnrollment[]
  detailEnrollment: ClassEnrollment | null
  session: UserSession | null
  isTeacher?: boolean
  profile?: UserProfile | null
  onOpenDetail: (enrollmentId: string) => void
  onBackToList: () => void
  onSubmitted: () => Promise<void>
  refreshButton: ReactNode
}) {
  if (!detailEnrollment) {
    return (
      <div className="space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
              {isTeacher ? "Jadwal Mengajar" : "Kelas Saya"}
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
              {isTeacher
                ? "Daftar kelas dan jadwal mengajar yang diberikan oleh Admin."
                : "Kelas aktif dan jadwal belajar kamu."}
            </p>
          </div>
          {refreshButton}
        </header>
        <ClassListView enrollments={enrollments} onOpenDetail={onOpenDetail} isTeacher={isTeacher} profile={profile} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBackToList} className="w-fit">
          <ChevronLeft className="size-4" />
          {isTeacher ? "Kembali ke Jadwal Mengajar" : "Kembali ke Kelas"}
        </Button>
        {refreshButton}
      </div>
      <NextSchedulePanel enrollment={detailEnrollment} isTeacher={isTeacher} profile={profile} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <ScheduleList enrollment={detailEnrollment} isTeacher={isTeacher} profile={profile} />
        {isTeacher ? (
          <TeacherScheduleCoordinationPanel enrollment={detailEnrollment} profile={profile ?? null} />
        ) : (
          <ReschedulePanel
            enrollment={detailEnrollment}
            session={session}
            onSubmitted={onSubmitted}
          />
        )}
      </div>
    </div>
  )
}

function getEventTrainerNames(enrollment: EventEnrollment) {
  const names = enrollment.eventSnapshot.trainers.map((trainer) => trainer.name).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "Trainer segera diumumkan"
}

function EventSessionAttendanceForm({
  enrollment,
  eventSession,
  session,
  onSubmitted,
  onClose,
}: {
  enrollment: EventEnrollment
  eventSession: EventEnrollment["eventSnapshot"]["sessions"][number]
  session: UserSession | null
  onSubmitted: () => void | Promise<void>
  onClose: () => void
}) {
  const sessionKey = `${eventSession.id || `session-${eventSession.sessionNumber || "unknown"}`}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  )
  const existingAttendance = enrollment.eventAttendances[sessionKey]
  const [materialSummary, setMaterialSummary] = useState(existingAttendance?.materialSummary ?? "")
  const [documentationFile, setDocumentationFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const attendanceWindow = getAttendanceWindow(eventSession.startsAt)
  const canSubmitAttendance = attendanceWindow.isOpen && materialSummary.trim().length > 0 && Boolean(documentationFile)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    if (nextFile && nextFile.size > MAX_UPLOAD_FILE_SIZE) {
      setDocumentationFile(null)
      setErrorMessage("Ukuran foto dokumentasi harus di bawah 1,5 MB.")
      event.target.value = ""
      return
    }

    setErrorMessage("")
    setDocumentationFile(nextFile)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!session) {
      setErrorMessage("Sesi login tidak ditemukan.")
      return
    }

    if (!attendanceWindow.isOpen) {
      setErrorMessage(attendanceWindow.reason)
      return
    }

    if (!documentationFile) {
      setErrorMessage("Upload foto dokumentasi dulu untuk mengirim absensi.")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      await submitEventSessionAttendance(session, {
        enrollment,
        sessionItem: eventSession,
        materialSummary,
        documentationFile,
      })
      await onSubmitted()
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Absensi belum berhasil dikirim.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {errorMessage && <FieldError>{errorMessage}</FieldError>}

        {existingAttendance && (
          <div className="rounded-md border border-primary/20 bg-brand-mint/40 px-3 py-2 text-sm font-medium text-primary">
            Absensi sesi ini sudah pernah dikirim. Mengirim ulang akan memperbarui data absensi.
          </div>
        )}

        {!attendanceWindow.isOpen && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {attendanceWindow.reason}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor={`material-${sessionKey}`}>Materi yang Didapat</FieldLabel>
          <Textarea
            id={`material-${sessionKey}`}
            value={materialSummary}
            onChange={(event) => setMaterialSummary(event.target.value)}
            placeholder="Jelaskan materi atau insight yang kamu dapat dari sesi ini."
            className="min-h-28 bg-white"
            disabled={!attendanceWindow.isOpen || isSubmitting}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`documentation-${sessionKey}`}>Foto Dokumentasi</FieldLabel>
          <Input
            id={`documentation-${sessionKey}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={!attendanceWindow.isOpen || isSubmitting}
            required
          />
          <FieldDescription>
            Upload foto dokumentasi maksimal 1,5 MB yang memperlihatkan dirimu hadir atau kamera sedang aktif.
            Foto akan dikompres sebelum disimpan.
          </FieldDescription>
          {documentationFile && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-brand-surface px-3 py-2 text-sm text-muted-foreground">
              <FileUp className="size-4 text-primary" />
              <span className="truncate">{documentationFile.name}</span>
            </div>
          )}
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting || !canSubmitAttendance}>
            {isSubmitting ? <Spinner /> : <Camera className="size-4" />}
            {isSubmitting ? "Mengirim Absensi..." : "Kirim Absensi"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

function EventSessionList({
  enrollment,
  session,
  onSubmitted,
}: {
  enrollment: EventEnrollment
  session: UserSession | null
  onSubmitted: () => void | Promise<void>
}) {
  const sessions = enrollment.eventSnapshot.sessions
  const [activeAttendanceSessionKey, setActiveAttendanceSessionKey] = useState("")
  const activeAttendanceSession =
    sessions.find((eventSession) => {
      const sessionKey = `${eventSession.id || `session-${eventSession.sessionNumber || "unknown"}`}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      )
      return sessionKey === activeAttendanceSessionKey
    }) ?? null
  const activeAttendanceWindow = activeAttendanceSession
    ? getAttendanceWindow(activeAttendanceSession.startsAt)
    : null

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-normal text-foreground">Daftar Sesi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length || 1} sesi event
          </p>
        </div>
        <CalendarClock className="size-5 text-primary" />
      </div>

      <div className="mt-5 grid gap-3">
        {sessions.length > 0 ? (
          sessions.map((eventSession) => {
            const sessionKey = `${eventSession.id || `session-${eventSession.sessionNumber || "unknown"}`}`.replace(
              /[^a-zA-Z0-9_-]/g,
              "_",
            )
            const existingAttendance = enrollment.eventAttendances[sessionKey]
            const attendanceWindow = getAttendanceWindow(eventSession.startsAt)

            return (
              <div
                key={eventSession.id || eventSession.sessionNumber}
                className="grid gap-4 rounded-lg border border-border bg-brand-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <Badge variant="outline" className="border-primary/20 bg-brand-mint text-primary">
                    Sesi {eventSession.sessionNumber || "-"}
                  </Badge>
                  {existingAttendance && (
                    <Badge variant="outline" className="ml-2 border-primary/20 bg-white text-primary">
                      Sudah Absensi
                    </Badge>
                  )}
                  <h3 className="mt-3 text-sm font-black text-foreground">
                    {eventSession.title || `Sesi ${eventSession.sessionNumber}`}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {formatScheduleDate(eventSession.startsAt, eventSession.timezone)}
                  </p>
                  {eventSession.notes && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{eventSession.notes}</p>
                  )}
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {attendanceWindow.isOpen && attendanceWindow.closesAt
                      ? `Absensi dibuka sampai ${formatScheduleDate(
                          attendanceWindow.closesAt.toISOString(),
                          eventSession.timezone,
                        )}.`
                      : attendanceWindow.reason}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={existingAttendance ? "outline" : "default"}
                  className="w-full sm:w-fit"
                  disabled={!attendanceWindow.isOpen}
                  onClick={() => setActiveAttendanceSessionKey(sessionKey)}
                >
                  {existingAttendance ? <CheckCircle2 className="size-4" /> : <Camera className="size-4" />}
                  {attendanceWindow.isOpen
                    ? existingAttendance
                      ? "Edit Absensi"
                      : "Absensi untuk sesi ini"
                    : "Absensi Ditutup"}
                </Button>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-brand-surface p-5 text-sm leading-7 text-muted-foreground">
            Jadwal sesi akan segera diumumkan.
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(activeAttendanceSession)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAttendanceSessionKey("")
          }
        }}
      >
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
          {activeAttendanceSession && activeAttendanceWindow && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-normal text-foreground">
                  Absensi Sesi {activeAttendanceSession.sessionNumber || "-"}
                </DialogTitle>
                <DialogDescription className="leading-6">
                  {activeAttendanceSession.title || `Sesi ${activeAttendanceSession.sessionNumber}`} -{" "}
                  {formatScheduleDate(activeAttendanceSession.startsAt, activeAttendanceSession.timezone)}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border bg-brand-surface p-4">
                <p className="text-sm font-bold text-foreground">Yang perlu dikirim</p>
                <div className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
                  <p className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    Ringkasan materi atau insight yang kamu dapat.
                  </p>
                  <p className="flex gap-2">
                    <Camera className="mt-0.5 size-4 shrink-0 text-primary" />
                    Foto dokumentasi yang memperlihatkan dirimu hadir atau kamera aktif.
                  </p>
                  <p className="flex gap-2">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
                    {activeAttendanceWindow.isOpen && activeAttendanceWindow.closesAt
                      ? `Batas absensi: ${formatScheduleDate(
                          activeAttendanceWindow.closesAt.toISOString(),
                          activeAttendanceSession.timezone,
                        )}.`
                      : activeAttendanceWindow.reason}
                  </p>
                </div>
              </div>

              <EventSessionAttendanceForm
                enrollment={enrollment}
                eventSession={activeAttendanceSession}
                session={session}
                onSubmitted={onSubmitted}
                onClose={() => setActiveAttendanceSessionKey("")}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function EventDetailPanel({ enrollment }: { enrollment: EventEnrollment }) {
  const statusMeta = eventEnrollmentStatusMeta[enrollment.status]
  const paymentMeta = paymentStatusMeta[enrollment.payment.status]

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-primary">
            <Ticket className="size-5" />
            Event Terdaftar
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            {enrollment.eventSnapshot.displayName}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
            {getEventTrainerNames(enrollment)}
          </p>
        </div>
        <StatusBadge label={statusMeta.label} className={statusMeta.className} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-l-2 border-brand-lime pl-4">
          <p className="text-sm font-bold text-muted-foreground">Tanggal</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {formatScheduleDay(enrollment.eventSnapshot.startsAt, enrollment.eventSnapshot.timezone)}
          </p>
        </div>
        <div className="border-l-2 border-border pl-4">
          <p className="text-sm font-bold text-muted-foreground">Jam</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {formatScheduleTime(enrollment.eventSnapshot.startsAt, enrollment.eventSnapshot.timezone)}
          </p>
        </div>
        <div className="border-l-2 border-border pl-4">
          <p className="text-sm font-bold text-muted-foreground">Payment</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {formatPrice(enrollment.payment.amount || enrollment.eventSnapshot.selectedPrice)}
          </p>
        </div>
        <div className="border-l-2 border-border pl-4">
          <p className="text-sm font-bold text-muted-foreground">Status Payment</p>
          <div className="mt-1">
            <StatusBadge label={paymentMeta.label} className={paymentMeta.className} />
          </div>
        </div>
      </div>
    </section>
  )
}

function EventsView({
  enrollments,
  detailEnrollment,
  session,
  onOpenDetail,
  onBackToList,
  onSubmitted,
  refreshButton,
}: {
  enrollments: EventEnrollment[]
  detailEnrollment: EventEnrollment | null
  session: UserSession | null
  onOpenDetail: (enrollmentId: string) => void
  onBackToList: () => void
  onSubmitted: () => void | Promise<void>
  refreshButton: ReactNode
}) {
  if (enrollments.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-brand-mint text-primary">
              <CalendarClock className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-normal text-foreground">Belum ada event</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Event yang sudah kamu daftar akan muncul di sini.
              </p>
            </div>
          </div>
          {refreshButton}
        </div>
        <Button asChild className="mt-5 w-full sm:w-fit">
          <Link href="/events">
            Lihat Event
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    )
  }

  if (detailEnrollment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onBackToList} className="w-fit">
            <ChevronLeft className="size-4" />
            Kembali ke Event
          </Button>
          {refreshButton}
        </div>
        <EventDetailPanel enrollment={detailEnrollment} />
        <EventSessionList enrollment={detailEnrollment} session={session} onSubmitted={onSubmitted} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Event Saya
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
            Semua event yang sudah kamu daftar.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {refreshButton}
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/events">
              Lihat Event Lain
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {enrollments.map((enrollment) => {
          const statusMeta = eventEnrollmentStatusMeta[enrollment.status]
          const paymentMeta = paymentStatusMeta[enrollment.payment.status]
          const sessionCount = enrollment.eventSnapshot.sessions.length || 1

          return (
            <section key={enrollment.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-black text-primary">
                    <Ticket className="size-4" />
                    Event
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(enrollment.id)}
                    className="mt-2 block text-left text-xl font-black tracking-normal text-foreground transition hover:text-primary focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {enrollment.eventSnapshot.displayName}
                  </button>
                </div>
                <StatusBadge label={statusMeta.label} className={statusMeta.className} />
              </div>

              <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-muted-foreground">Jadwal</span>
                  <span className="text-right font-black text-foreground">
                    {formatScheduleDay(enrollment.eventSnapshot.startsAt, enrollment.eventSnapshot.timezone)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-muted-foreground">Jam</span>
                  <span className="font-black text-foreground">
                    {formatScheduleTime(enrollment.eventSnapshot.startsAt, enrollment.eventSnapshot.timezone)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-muted-foreground">Trainer</span>
                  <span className="text-right font-black text-foreground">{getEventTrainerNames(enrollment)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-muted-foreground">Sesi</span>
                  <span className="font-black text-foreground">{sessionCount} sesi</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-surface px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">Payment</p>
                  <p className="mt-1 text-lg font-black text-foreground">
                    {formatPrice(enrollment.payment.amount || enrollment.eventSnapshot.selectedPrice)}
                  </p>
                </div>
                <StatusBadge label={paymentMeta.label} className={paymentMeta.className} />
              </div>

              <Button type="button" onClick={() => onOpenDetail(enrollment.id)} className="mt-5 h-11 w-full">
                Detail Event
                <ArrowRight className="size-4" />
              </Button>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ProfileView({
  profile,
  session,
  onProfileUpdated,
  refreshButton,
}: {
  profile: UserProfile | null
  session: UserSession | null
  onProfileUpdated: (profile: UserProfile) => void
  refreshButton: ReactNode
}) {
  const [isEditing, setIsEditing] = useState(!isProfileComplete(profile))
  const [draftProfile, setDraftProfile] = useState<UserProfileInput>(() => createProfileInput(profile, session))
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const profileItems = [
    { label: "Status Akun", value: profile?.role === "teacher" ? "Guru / Pengajar" : "Siswa (Learner)" },
    { label: "Nama Lengkap", value: profile?.fullName || session?.displayName || "-" },
    { label: "Nama Panggilan", value: profile?.nickname || "-" },
    { label: "Email", value: profile?.email || session?.email || "-" },
    { label: "Nomor Telepon", value: profile?.phoneNumber || "-" },
    { label: "Tanggal Lahir", value: profile?.birthDate || "-" },
    { label: "Tempat Lahir", value: profile?.birthPlace || "-" },
    { label: "Pendidikan Terakhir", value: profile?.lastEducation || "-" },
    { label: "Alamat KTP", value: profile?.ktpAddress || "-", wide: true },
    { label: "Alamat Domisili", value: profile?.domicileAddress || "-", wide: true },
  ]

  useEffect(() => {
    setDraftProfile(createProfileInput(profile, session))
    setIsEditing(!isProfileComplete(profile))
  }, [profile, session])

  const updateDraftProfile = <Field extends keyof UserProfileInput>(
    field: Field,
    value: UserProfileInput[Field],
  ) => {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }))
  }

  const handleSubmit = async (profileInput: UserProfileInput) => {
    if (!session) {
      setErrorMessage("Sesi login tidak ditemukan.")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      await saveUserProfile(session, profileInput)
      const updatedProfile =
        (await getUserProfile(session).catch(() => null)) ??
        ({
          ...profileInput,
          uid: profile?.uid || session.uid,
          role: profile?.role || "student",
          status: profile?.status || "active",
          createdBy: profile?.createdBy,
          username: profile?.username,
          authProvider: profile?.authProvider || session.provider,
          profileCompleted: true,
          isProfileComplete: true,
          createdAt: profile?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies UserProfile)

      onProfileUpdated(updatedProfile)
      setDraftProfile(profileInput)
      setIsEditing(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil belum berhasil disimpan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-normal text-foreground sm:text-3xl">
              Edit Profil
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Lengkapi atau perbarui data profil kamu.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {refreshButton}
            {isProfileComplete(profile) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorMessage("")
                  setDraftProfile(createProfileInput(profile, session))
                  setIsEditing(false)
                }}
              >
                Batal
              </Button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <ProfileForm
          value={draftProfile}
          isSubmitting={isSubmitting}
          submitLabel="Simpan Profil"
          onChange={updateDraftProfile}
          onSubmit={handleSubmit}
        />
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-mint text-primary">
            <UserRound className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-normal text-foreground">
              {profile?.fullName || session?.displayName || "Profile"}
            </h2>
            {profile?.nickname && (
              <p className="mt-1 text-sm font-bold text-primary">{profile.nickname}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{profile?.email || session?.email}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {refreshButton}
          <Button
            type="button"
            className="shrink-0"
            onClick={() => {
              setErrorMessage("")
              setDraftProfile(createProfileInput(profile, session))
              setIsEditing(true)
            }}
          >
            <Edit3 className="size-4" />
            Edit Profil
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {profileItems.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-lg border border-border bg-brand-surface p-4",
              item.wide && "sm:col-span-2",
            )}
          >
            <p className="text-sm font-bold text-muted-foreground">{item.label}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function createProfileInput(profile: UserProfile | null, session: UserSession | null): UserProfileInput {
  return {
    ...emptyProfileInput,
    fullName: profile?.fullName || session?.displayName || "",
    nickname: profile?.nickname || "",
    phoneCountryCode: profile?.phoneCountryCode || "+62",
    phoneNationalNumber: profile?.phoneNationalNumber || "",
    phoneNumber: profile?.phoneNumber || "",
    email: profile?.email || session?.email || "",
    birthDate: profile?.birthDate || "",
    birthPlace: profile?.birthPlace || "",
    ktpStreet: profile?.ktpStreet || "",
    ktpProvinceId: profile?.ktpProvinceId || "",
    ktpProvinceName: profile?.ktpProvinceName || "",
    ktpRegencyId: profile?.ktpRegencyId || "",
    ktpRegencyName: profile?.ktpRegencyName || "",
    ktpDistrictId: profile?.ktpDistrictId || "",
    ktpDistrictName: profile?.ktpDistrictName || "",
    ktpVillageId: profile?.ktpVillageId || "",
    ktpVillageName: profile?.ktpVillageName || "",
    ktpAddress: profile?.ktpAddress || "",
    domicileSameAsKtp: profile?.domicileSameAsKtp || false,
    domicileStreet: profile?.domicileStreet || "",
    domicileProvinceId: profile?.domicileProvinceId || "",
    domicileProvinceName: profile?.domicileProvinceName || "",
    domicileRegencyId: profile?.domicileRegencyId || "",
    domicileRegencyName: profile?.domicileRegencyName || "",
    domicileDistrictId: profile?.domicileDistrictId || "",
    domicileDistrictName: profile?.domicileDistrictName || "",
    domicileVillageId: profile?.domicileVillageId || "",
    domicileVillageName: profile?.domicileVillageName || "",
    domicileAddress: profile?.domicileAddress || "",
    lastEducation: profile?.lastEducation || "",
  }
}

export function HomeDashboard() {
  const router = useRouter()
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([])
  const [eventEnrollments, setEventEnrollments] = useState<EventEnrollment[]>([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("")
  const [selectedClassDetailId, setSelectedClassDetailId] = useState("")
  const [selectedEventDetailId, setSelectedEventDetailId] = useState("")
  const [activeView, setActiveView] = useState<DashboardView>("home")
  const isTeacher = profile?.role === "teacher"
  const [errorMessage, setErrorMessage] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshInFlightRef = useRef(false)
  const lastActiveTabRefreshAtRef = useRef(0)

  const selectedEnrollment = useMemo(() => {
    return (
      enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) ??
      enrollments[0] ??
      null
    )
  }, [enrollments, selectedEnrollmentId])

  const activeClassEnrollments = useMemo(() => getActiveClassEnrollments(enrollments), [enrollments])
  const paymentEnrollments = useMemo(
    () => [...enrollments, ...eventEnrollments],
    [enrollments, eventEnrollments],
  )
  const detailEnrollment = useMemo(() => {
    return (
      activeClassEnrollments.find((enrollment) => enrollment.id === selectedClassDetailId) ??
      null
    )
  }, [activeClassEnrollments, selectedClassDetailId])
  const detailEventEnrollment = useMemo(() => {
    return (
      eventEnrollments.find((enrollment) => enrollment.id === selectedEventDetailId) ??
      null
    )
  }, [eventEnrollments, selectedEventDetailId])

  const loadEnrollments = useCallback(async (activeSession: UserSession, userProfile?: UserProfile | null) => {
    const effectiveProfile = userProfile ?? profile
    const isTeacherUser = effectiveProfile?.role === "teacher"
    const { classEnrollments, eventEnrollments } = await getUserEnrollmentOverview(activeSession, effectiveProfile)

    setEnrollments(classEnrollments)
    setEventEnrollments(isTeacherUser ? [] : eventEnrollments)
    setSelectedEventDetailId((currentId) => {
      if (currentId && eventEnrollments.some((enrollment) => enrollment.id === currentId)) {
        return currentId
      }

      return ""
    })
    setSelectedEnrollmentId((currentId) => {
      if (currentId && classEnrollments.some((enrollment) => enrollment.id === currentId)) {
        return currentId
      }

      return classEnrollments[0]?.id ?? ""
    })
  }, [isTeacher])

  const refreshEnrollments = useCallback(
    async ({
      reportError = false,
    }: {
      reportError?: boolean
    } = {}) => {
      if (refreshInFlightRef.current) {
        return
      }

      refreshInFlightRef.current = true
      setIsRefreshing(true)

      try {
        const validSession = await getValidSession()

        if (!validSession) {
          setGuardState("redirecting")
          router.replace(createAuthRedirectPath("/login", "/home"))
          return
        }

        setSession(validSession)
        await loadEnrollments(validSession, profile)
        setErrorMessage("")
      } catch (error) {
        if (reportError) {
          setErrorMessage(error instanceof Error ? error.message : "Data kelas dan event belum bisa dimuat ulang.")
        }
      } finally {
        refreshInFlightRef.current = false
        setIsRefreshing(false)
      }
    },
    [loadEnrollments, router],
  )

  useEffect(() => {
    let isMounted = true

    async function prepareDashboard() {
      const validSession = await getValidSession().catch(() => null)

      if (!isMounted) {
        return
      }

      if (!validSession) {
        setGuardState("redirecting")
        router.replace(createAuthRedirectPath("/login", "/home"))
        return
      }

      const existingProfile = await getUserProfile(validSession).catch(() => null)

      if (!isMounted) {
        return
      }

      setSession(validSession)
      setProfile(existingProfile)
      setActiveView(isProfileComplete(existingProfile) ? "home" : "profile")

      try {
        await loadEnrollments(validSession, existingProfile)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Data kelas dan event belum bisa dimuat.")
      }

      if (isMounted) {
        setGuardState("ready")
      }
    }

    prepareDashboard()

    return () => {
      isMounted = false
    }
  }, [loadEnrollments, router])

  useEffect(() => {
    if (guardState !== "ready" || !session) {
      return
    }

    const refreshAfterReturningToTab = () => {
      if (document.visibilityState !== "visible") {
        return
      }

      const now = Date.now()

      if (now - lastActiveTabRefreshAtRef.current < ENROLLMENT_ACTIVE_TAB_REFRESH_THROTTLE_MS) {
        return
      }

      lastActiveTabRefreshAtRef.current = now
      void refreshEnrollments()
    }

    window.addEventListener("focus", refreshAfterReturningToTab)
    window.addEventListener("online", refreshAfterReturningToTab)
    window.addEventListener("pageshow", refreshAfterReturningToTab)
    document.addEventListener("visibilitychange", refreshAfterReturningToTab)

    return () => {
      window.removeEventListener("focus", refreshAfterReturningToTab)
      window.removeEventListener("online", refreshAfterReturningToTab)
      window.removeEventListener("pageshow", refreshAfterReturningToTab)
      document.removeEventListener("visibilitychange", refreshAfterReturningToTab)
    }
  }, [guardState, refreshEnrollments, session])

  useEffect(() => {
    if (isTeacher && (activeView === "payments" || activeView === "events")) {
      setActiveView("home")
    }
  }, [isTeacher, activeView])

  const handleRefresh = async () => {
    if (!session) {
      return
    }

    setErrorMessage("")
    await refreshEnrollments({ reportError: true })
  }

  const scrollDashboardToTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  const handleChangeView = (view: DashboardView) => {
    // Teacher guard: Teacher has no payments and no events
    if (isTeacher && (view === "payments" || view === "events")) {
      setActiveView("home")
      scrollDashboardToTop()
      return
    }

    setActiveView(view)
    scrollDashboardToTop()

    if (view === "classes") {
      setSelectedClassDetailId("")
    }

    if (view === "events") {
      setSelectedEventDetailId("")
    }

    if (guardState === "ready" && session) {
      void refreshEnrollments()
    }
  }

  const handleOpenClassDetail = (enrollmentId: string) => {
    setSelectedClassDetailId(enrollmentId)
    setActiveView("classes")
    scrollDashboardToTop()
  }

  const handleBackToClassList = () => {
    setSelectedClassDetailId("")
    scrollDashboardToTop()
  }

  const handleOpenEventDetail = (enrollmentId: string) => {
    setSelectedEventDetailId(enrollmentId)
    setActiveView("events")
    scrollDashboardToTop()
  }

  const handleBackToEventList = () => {
    setSelectedEventDetailId("")
    scrollDashboardToTop()
  }

  if (guardState !== "ready") {
    if (guardState === "redirecting") {
      return (
        <div className="mx-auto w-full max-w-xl px-6 pb-16 pt-28 md:pt-32">
          <LoadingCard
            title="Mengarahkan akun..."
            description="Kami cek sesi, profil, dan data kelas serta event kamu dulu."
          />
        </div>
      )
    }

    return (
      <div className="bg-brand-surface px-6 pb-32 pt-24 lg:pb-16 lg:pt-28">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Skeleton Sidebar (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm">
              <div className="rounded-lg bg-brand-surface p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div className="space-y-1 pt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                    <Skeleton className="size-5 rounded-md" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Skeleton Main Content */}
          <main className="min-w-0 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>

            {/* Skeleton Next Schedule Card */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-60" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Skeleton Quick Class List */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-36 rounded-lg" />
                <Skeleton className="h-36 rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const refreshButton = (
    <DashboardRefreshButton isRefreshing={isRefreshing} onRefresh={handleRefresh} />
  )

  return (
    <div className="bg-brand-surface px-6 pb-32 pt-24 lg:pb-16 lg:pt-28">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebarNav
          activeView={activeView}
          onChange={handleChangeView}
          profile={profile}
          session={session}
          isTeacher={isTeacher}
        />

        <main className="min-w-0 space-y-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {activeView === "home" && (
            <DashboardHomeView
              selectedEnrollment={selectedEnrollment}
              enrollments={enrollments}
              profile={profile}
              session={session}
              isTeacher={isTeacher}
              onOpenClasses={() => handleChangeView("classes")}
              refreshButton={refreshButton}
            />
          )}

          {activeView === "payments" && !isTeacher && (
            <PaymentsView enrollments={paymentEnrollments} refreshButton={refreshButton} />
          )}

          {activeView === "classes" && (
            <ClassesView
              enrollments={activeClassEnrollments}
              detailEnrollment={detailEnrollment}
              session={session}
              isTeacher={isTeacher}
              profile={profile}
              onOpenDetail={handleOpenClassDetail}
              onBackToList={handleBackToClassList}
              onSubmitted={handleRefresh}
              refreshButton={refreshButton}
            />
          )}

          {activeView === "events" && !isTeacher && (
            <EventsView
              enrollments={eventEnrollments}
              detailEnrollment={detailEventEnrollment}
              session={session}
              onOpenDetail={handleOpenEventDetail}
              onBackToList={handleBackToEventList}
              onSubmitted={handleRefresh}
              refreshButton={refreshButton}
            />
          )}

          {activeView === "profile" && (
            <ProfileView
              profile={profile}
              session={session}
              onProfileUpdated={(updatedProfile) => {
                setProfile(updatedProfile)
                setActiveView("profile")
              }}
              refreshButton={refreshButton}
            />
          )}
        </main>
      </div>

      <DashboardBottomNav activeView={activeView} onChange={handleChangeView} isTeacher={isTeacher} />
    </div>
  )
}
