"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  FileUp,
  LockKeyhole,
  Ticket,
  UploadCloud,
  UsersRound,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { createAuthRedirectPath, getCurrentPathAsReturnTo } from "@/features/auth/services/auth-redirect"
import {
  createFreeEventPayment,
  getExistingActiveEventEnrollment,
  createManualEventEnrollmentPayment,
  manualPaymentAccount,
  saveEventEnrollment,
  sendAdminRegistrationNotification,
  sendEventRegistrationEmail,
  sendRegistrationZawaMessage,
  uploadEventPaymentProof,
  type EventEnrollment,
  type EventEnrollmentPayment,
} from "@/features/enrollments/services/enrollments"
import type { Event } from "@/features/events/services/events"
import {
  getUserProfile,
  getValidSession,
  isProfileComplete,
  type UserProfile,
  type UserSession,
} from "@/features/auth/services/firebase-auth"

type EventRegistrationFormProps = {
  eventItem: Event
}

type GuardState = "checking" | "redirecting" | "ready"
const MAX_UPLOAD_FILE_SIZE = Math.floor(1.5 * 1024 * 1024)

function getLocalizedText(text: Event["name"] | Event["longDescription"]) {
  return text.id || text.en || text.zh
}

function getEventImage(eventItem: Event) {
  return eventItem.coverImage || eventItem.images[0]?.url || ""
}

function getSelectedEventPrice(eventItem: Event) {
  return eventItem.priceType === "free" ? 0 : eventItem.price
}

function formatPrice(price: number) {
  if (price <= 0) {
    return "Gratis"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
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

function getTrainerNames(eventItem: Event) {
  const names = eventItem.trainers.map((trainer) => trainer.name).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "Trainer segera diumumkan"
}

function LoadingState({ state }: { state: GuardState }) {
  const isRedirecting = state === "redirecting"

  return (
    <LoadingCard
      title={isRedirecting ? "Mengarahkan akun..." : "Mengecek sesi dan profil..."}
      description="Pendaftaran event membutuhkan akun dan profil lengkap."
      icon={isRedirecting ? <LockKeyhole className="size-5" /> : undefined}
    />
  )
}

export function EventRegistrationForm({ eventItem }: EventRegistrationFormProps) {
  const router = useRouter()
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reason, setReason] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEnrollmentId, setSubmittedEnrollmentId] = useState("")
  const [existingEnrollment, setExistingEnrollment] = useState<EventEnrollment | null>(null)

  const eventName = getLocalizedText(eventItem.name)
  const eventImage = getEventImage(eventItem)
  const selectedPrice = useMemo(() => getSelectedEventPrice(eventItem), [eventItem])
  const isFreeEvent = selectedPrice <= 0

  useEffect(() => {
    let isMounted = true

    async function prepareRegistration() {
      const returnTo = getCurrentPathAsReturnTo()
      const validSession = await getValidSession().catch(() => null)

      if (!isMounted) {
        return
      }

      if (!validSession) {
        setGuardState("redirecting")
        router.replace(createAuthRedirectPath("/login", returnTo))
        return
      }

      const existingProfile = await getUserProfile(validSession).catch(() => null)

      if (!isMounted) {
        return
      }

      if (!existingProfile || !isProfileComplete(existingProfile)) {
        setGuardState("redirecting")
        router.replace(createAuthRedirectPath("/profile/setup", returnTo))
        return
      }

      const activeEventEnrollment = await getExistingActiveEventEnrollment(validSession, eventItem).catch(() => null)

      if (!isMounted) {
        return
      }

      setSession(validSession)
      setProfile(existingProfile)
      setExistingEnrollment(activeEventEnrollment)
      setGuardState("ready")
    }

    prepareRegistration()

    return () => {
      isMounted = false
    }
  }, [eventItem, router])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    if (nextFile && nextFile.size > MAX_UPLOAD_FILE_SIZE) {
      setPaymentProof(null)
      setErrorMessage("Ukuran bukti pembayaran harus di bawah 1,5 MB.")
      event.target.value = ""
      return
    }

    setErrorMessage("")
    setPaymentProof(nextFile)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!session || !profile) {
      router.replace(createAuthRedirectPath("/login", getCurrentPathAsReturnTo()))
      return
    }

    if (existingEnrollment) {
      setErrorMessage("Kamu sudah terdaftar di event ini. Detailnya bisa dicek di dashboard.")
      return
    }

    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      setErrorMessage("Alasan mengikuti event wajib diisi.")
      return
    }

    if (!isFreeEvent && !paymentProof) {
      setErrorMessage("Upload bukti pembayaran dulu untuk melanjutkan pendaftaran event.")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      let eventPayment: EventEnrollmentPayment

      if (isFreeEvent) {
        eventPayment = createFreeEventPayment()
      } else {
        if (!paymentProof) {
          throw new Error("Upload bukti pembayaran dulu untuk melanjutkan pendaftaran event.")
        }

        const uploadResult = await uploadEventPaymentProof({
          file: paymentProof,
          session,
          eventItem,
        })

        eventPayment = createManualEventEnrollmentPayment({
          eventItem,
          proofUrl: uploadResult.proofUrl,
          proofFile: paymentProof,
          uploadResponse: uploadResult.rawResponse,
        })
      }

      const enrollmentId = await saveEventEnrollment(session, {
        eventItem,
        profile,
        reason: trimmedReason,
        payment: eventPayment,
      })

      await sendEventRegistrationEmail({
        session,
        profile,
        eventItem,
        enrollmentId,
      }).catch((emailError) => {
        console.warn("Event registration email failed:", emailError)
      })

      await sendAdminRegistrationNotification({
        session,
        profile,
        registrationType: "event",
        itemName: eventName,
        itemPrice: formatEventPrice(eventItem),
      }).catch((adminWaError) => {
        console.warn("Admin WhatsApp notification failed:", adminWaError)
      })

      await sendRegistrationZawaMessage({
        session,
        profile,
        registrationType: "event",
        itemName: eventName,
      }).catch((zawaError) => {
        console.warn("Event registration WhatsApp message failed:", zawaError)
      })

      setSubmittedEnrollmentId(enrollmentId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Pendaftaran event belum berhasil dikirim.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (guardState !== "ready") {
    return <LoadingState state={guardState} />
  }

  if (submittedEnrollmentId) {
    return (
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-brand-mint text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">
              {isFreeEvent ? "Terdaftar" : "Menunggu Konfirmasi Admin"}
            </Badge>
            <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground">
              Pendaftaran event terkirim
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {isFreeEvent
                ? `Kamu sudah terdaftar untuk ${eventName}. Detail event bisa kamu cek di dashboard.`
                : `Bukti pembayaran untuk ${eventName} sudah diupload. Admin akan mengecek pembayaran dan menghubungi kamu maksimal 1x24 jam.`}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/home">
                  <CheckCircle2 className="size-4" />
                  Lihat Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">Lihat Event Lain</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (existingEnrollment) {
    return (
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-brand-mint text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="min-w-0">
            <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">Sudah Terdaftar</Badge>
            <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground">
              Kamu sudah punya pendaftaran event ini
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Pendaftaran untuk {eventName} sudah tersimpan. Kamu tidak perlu daftar ulang untuk event yang sama.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/home">
                  <CheckCircle2 className="size-4" />
                  Lihat Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">Lihat Event Lain</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div className="h-44 w-full overflow-hidden rounded-lg bg-brand-mint md:h-[138px] md:w-[220px]">
            {eventImage ? (
              <img src={eventImage} alt={eventName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <Ticket className="size-12" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">
              {eventItem.sessions.length || 1} sesi
            </Badge>
            <h2 className="mt-3 text-xl font-black tracking-normal text-foreground sm:text-2xl">
              {eventName}
            </h2>
            <p className="mt-3 text-2xl font-black text-primary">{formatPrice(selectedPrice)}</p>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                {formatEventDate(eventItem.startsAt, eventItem.timezone)}
              </p>
              <p className="flex items-center gap-2">
                <UsersRound className="size-4 text-primary" />
                {getTrainerNames(eventItem)}
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
          <h1 className="mt-4 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Daftar Event
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Lengkapi alasan mengikuti event
            {isFreeEvent ? "." : ", lalu upload bukti transfer pembayaran."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {errorMessage && <FieldError>{errorMessage}</FieldError>}

            <Field>
              <FieldLabel htmlFor="reason">Alasan Mengikuti Event</FieldLabel>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ceritakan tujuan ikut event dan hal yang ingin kamu dapatkan."
                className="min-h-32"
                required
              />
              <FieldDescription>
                Jawaban ini membantu tim memahami kebutuhan peserta sebelum event dimulai.
              </FieldDescription>
            </Field>

            {isFreeEvent ? (
              <Alert className="border-primary/20 bg-brand-mint/40 text-foreground">
                <Ticket className="size-4" />
                <AlertTitle>Event Gratis</AlertTitle>
                <AlertDescription>
                  Tidak perlu pembayaran. Pendaftaran akan langsung tersimpan sebagai terdaftar.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="border-primary/20 bg-brand-mint/40 text-foreground">
                  <Banknote className="size-4" />
                  <AlertTitle>Petunjuk Pembayaran</AlertTitle>
                  <AlertDescription>
                    <p>Transfer biaya event ke rekening berikut:</p>
                    <div className="my-2 grid gap-1 text-sm">
                      <p className="font-bold text-foreground">{manualPaymentAccount.bankName}</p>
                      <p>No. Rek: {manualPaymentAccount.accountNumber}</p>
                      <p>a.n. {manualPaymentAccount.accountHolderName}</p>
                    </div>
                    <p>Simpan bukti pembayaran berupa screenshot atau foto.</p>
                  </AlertDescription>
                </Alert>

                <Field>
                  <FieldLabel htmlFor="paymentProof">Upload Bukti Pembayaran</FieldLabel>
                  <Input
                    id="paymentProof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                  <FieldDescription>
                    Format gambar atau PDF, maksimal 1,5 MB. File gambar akan dikompres sebelum disimpan.
                  </FieldDescription>
                  {paymentProof && (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-brand-surface px-3 py-2 text-sm text-muted-foreground">
                      <FileUp className="size-4 text-primary" />
                      <span className="truncate">{paymentProof.name}</span>
                    </div>
                  )}
                </Field>
              </>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Spinner /> : <UploadCloud className="size-4" />}
              {isSubmitting ? "Mengirim Pendaftaran..." : "Kirim Pendaftaran"}
            </Button>
          </FieldGroup>
        </form>
      </section>
    </div>
  )
}
