"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileUp,
  LockKeyhole,
  UploadCloud,
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LoadingCard, Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createAuthRedirectPath, getCurrentPathAsReturnTo } from "@/features/auth/services/auth-redirect"
import type { Class } from "@/features/classes/services/classes"
import {
  createManualEnrollmentPayment,
  getExistingActiveClassEnrollment,
  manualPaymentAccount,
  saveClassEnrollment,
  sendClassRegistrationEmail,
  sendRegistrationZawaMessage,
  uploadPaymentProof,
  type ClassEnrollment,
  type PaymentMethod,
} from "@/features/enrollments/services/enrollments"
import {
  getUserProfile,
  getValidSession,
  isProfileComplete,
  type UserProfile,
  type UserSession,
} from "@/features/auth/services/firebase-auth"
import { cn } from "@/lib/utils"

type ClassRegistrationFormProps = {
  classItem: Class
}

type GuardState = "checking" | "redirecting" | "ready"
const MAX_UPLOAD_FILE_SIZE = Math.floor(1.5 * 1024 * 1024)

const typeLabel: Record<Class["type"], string> = {
  private: "Kelas Private",
  group: "Kelas Grup",
}

function getLocalizedClassName(classItem: Class) {
  return classItem.name.id || classItem.name.en || classItem.name.zh
}

function getClassImage(classItem: Class) {
  return classItem.coverImage || classItem.images[0]?.url || ""
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

function getSelectedClassPrice(classItem: Class) {
  return classItem.discountPrice ?? classItem.price
}

function LoadingState({ state }: { state: GuardState }) {
  const isRedirecting = state === "redirecting"

  return (
    <LoadingCard
      title={isRedirecting ? "Mengarahkan akun..." : "Mengecek sesi dan profil..."}
      description="Pendaftaran kelas membutuhkan akun dan profil lengkap."
      icon={isRedirecting ? <LockKeyhole className="size-5" /> : undefined}
    />
  )
}

export function ClassRegistrationForm({ classItem }: ClassRegistrationFormProps) {
  const router = useRouter()
  const [guardState, setGuardState] = useState<GuardState>("checking")
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reason, setReason] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEnrollmentId, setSubmittedEnrollmentId] = useState("")
  const [existingEnrollment, setExistingEnrollment] = useState<ClassEnrollment | null>(null)

  const className = getLocalizedClassName(classItem)
  const classImage = getClassImage(classItem)
  const selectedPrice = useMemo(() => getSelectedClassPrice(classItem), [classItem])
  const hasDiscount =
    typeof classItem.discountPrice === "number" && classItem.discountPrice < classItem.price

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

      const activeClassEnrollment = await getExistingActiveClassEnrollment(validSession, classItem).catch(() => null)

      if (!isMounted) {
        return
      }

      setSession(validSession)
      setProfile(existingProfile)
      setExistingEnrollment(activeClassEnrollment)
      setGuardState("ready")
    }

    prepareRegistration()

    return () => {
      isMounted = false
    }
  }, [classItem, router])

  const handlePaymentMethodChange = (value: string) => {
    if (value === "manual" || value === "payment_gateway") {
      setPaymentMethod(value)
    }
  }

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
      setErrorMessage("Kamu sudah terdaftar di kelas ini. Detailnya bisa dicek di dashboard.")
      return
    }

    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      setErrorMessage("Alasan mengikuti kelas wajib diisi.")
      return
    }

    if (paymentMethod !== "manual") {
      setErrorMessage("Payment gateway belum tersedia. Gunakan pembayaran manual dulu ya.")
      return
    }

    if (!paymentProof) {
      setErrorMessage("Upload bukti pembayaran dulu untuk melanjutkan pendaftaran.")
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const uploadResult = await uploadPaymentProof({
        file: paymentProof,
        session,
        classItem,
      })
      const payment = createManualEnrollmentPayment({
        classItem,
        proofUrl: uploadResult.proofUrl,
        proofFile: paymentProof,
        uploadResponse: uploadResult.rawResponse,
      })
      const enrollmentId = await saveClassEnrollment(session, {
        classItem,
        profile,
        reason: trimmedReason,
        payment,
      })

      await sendClassRegistrationEmail({
        session,
        profile,
        classItem,
        enrollmentId,
      }).catch((emailError) => {
        console.warn("Class registration email failed:", emailError)
      })

      await sendRegistrationZawaMessage({
        session,
        profile,
        registrationType: "class",
        itemName: className,
      }).catch((zawaError) => {
        console.warn("Class registration Zawa message failed:", zawaError)
      })

      setSubmittedEnrollmentId(enrollmentId)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Pendaftaran belum berhasil dikirim.",
      )
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
              Menunggu Konfirmasi Admin
            </Badge>
            <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground">
              Pendaftaran kelas terkirim
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Bukti pembayaran untuk {className} sudah diupload. Admin akan mengecek pembayaran
              dan menghubungi kamu maksimal 1x24 jam.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/home">
                  <CheckCircle2 className="size-4" />
                  Lihat Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/classes">Lihat Kelas Lain</Link>
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
              Kamu sudah punya pendaftaran kelas ini
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Pendaftaran untuk {className} sudah tersimpan. Kamu tidak perlu daftar ulang untuk kelas yang sama.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/home">
                  <CheckCircle2 className="size-4" />
                  Lihat Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/classes">Lihat Kelas Lain</Link>
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
            {classImage ? (
              <img src={classImage} alt={className} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <Clock3 className="size-12" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <Badge className="bg-brand-mint text-primary hover:bg-brand-mint">
              {typeLabel[classItem.type]}
            </Badge>
            <h2 className="mt-3 text-xl font-black tracking-normal text-foreground sm:text-2xl">
              {className}
            </h2>

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
                <Clock3 className="size-4 text-primary" />
                {classItem.totalSessions} sesi
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" />
                {classItem.sessionDurationMinutes} menit/sesi
              </p>
              <p className="font-medium text-foreground">Level: {classItem.level || "All levels"}</p>
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
          <h1 className="mt-4 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            Daftar Kelas
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Lengkapi alasan mengikuti kelas, pilih metode pembayaran, lalu upload bukti transfer.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {errorMessage && <FieldError>{errorMessage}</FieldError>}

            <Field>
              <FieldLabel htmlFor="reason">Alasan Mengikuti Kelas</FieldLabel>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ceritakan tujuan belajar dan target yang ingin kamu capai."
                className="min-h-32"
                required
              />
              <FieldDescription>
                Jawaban ini membantu tim menyesuaikan arahan belajar sebelum kelas dimulai.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Metode Pembayaran</FieldLabel>
              <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                <Label
                  htmlFor="payment-manual"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-white p-4 transition hover:border-primary/50",
                    paymentMethod === "manual" && "border-primary bg-brand-mint/40",
                  )}
                >
                  <RadioGroupItem id="payment-manual" value="manual" className="mt-1" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Banknote className="size-4 text-primary" />
                      Pembayaran Manual
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      Transfer ke rekening LKP SlangTech, upload bukti pembayaran, lalu tunggu
                      konfirmasi admin.
                    </span>
                  </span>
                </Label>

                <Label
                  htmlFor="payment-gateway"
                  className="flex cursor-not-allowed items-start gap-3 rounded-lg border border-border bg-brand-surface p-4 opacity-70"
                >
                  <RadioGroupItem id="payment-gateway" value="payment_gateway" disabled className="mt-1" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <CreditCard className="size-4 text-muted-foreground" />
                      Payment Gateway
                      <Badge variant="outline">Segera hadir</Badge>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      Pembayaran otomatis akan tersedia setelah integrasi gateway aktif.
                    </span>
                  </span>
                </Label>
              </RadioGroup>
            </Field>

            <Alert className="border-primary/20 bg-brand-mint/40 text-foreground">
              <AlertTitle>Petunjuk Pembayaran</AlertTitle>
              <AlertDescription>
                <p>Transfer biaya kelas ke rekening berikut:</p>
                <div className="my-2 grid gap-1 text-sm">
                  <p className="font-bold text-foreground">{manualPaymentAccount.bankName}</p>
                  <p>No. Rek: {manualPaymentAccount.accountNumber}</p>
                  <p>a.n. {manualPaymentAccount.accountHolderName}</p>
                </div>
                <p>Simpan bukti pembayaran berupa screenshot atau foto.</p>
                <p>Upload bukti pembayaran pada form pendaftaran.</p>
                <p>Tunggu konfirmasi dari admin maksimal 1x24 jam.</p>
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
