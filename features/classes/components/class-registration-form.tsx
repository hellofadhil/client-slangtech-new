"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState("")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [senderBankName, setSenderBankName] = useState("")
  const [senderAccountName, setSenderAccountName] = useState("")
  const [copiedAccount, setCopiedAccount] = useState(false)
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

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(manualPaymentAccount.accountNumber)
      setCopiedAccount(true)
      setTimeout(() => setCopiedAccount(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleNextToPayment = (event: FormEvent) => {
    event.preventDefault()
    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      setErrorMessage("Alasan mengikuti kelas wajib diisi sebelum lanjut ke pembayaran.")
      return
    }

    setErrorMessage("")
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToStep1 = () => {
    setErrorMessage("")
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
      setCurrentStep(1)
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
        senderBankName,
        senderAccountName,
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

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <Link
            href="/classes"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-brand-green-strong"
          >
            <ArrowLeft className="size-4" />
            Kembali ke daftar kelas
          </Link>

          {/* Stepper indicator */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-black transition",
                  currentStep === 1
                    ? "bg-primary text-white shadow-sm"
                    : "bg-brand-mint text-primary border border-primary/30"
                )}
              >
                1
              </span>
              <span className={cn("text-sm font-bold", currentStep === 1 ? "text-foreground" : "text-muted-foreground")}>
                Alasan Belajar
              </span>
            </div>

            <div className="h-0.5 w-8 bg-border" />

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-black transition",
                  currentStep === 2
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                2
              </span>
              <span className={cn("text-sm font-bold", currentStep === 2 ? "text-foreground" : "text-muted-foreground")}>
                Pembayaran
              </span>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
            {currentStep === 1 ? "Alasan Mengikuti Kelas" : "Pembayaran Biaya Kelas"}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {currentStep === 1
              ? "Ceritakan tujuan belajarmu agar materi bisa disesuaikan dengan kebutuhanmu."
              : "Transfer ke rekening resmi LKP SlangTech dan upload bukti transfer untuk konfirmasi."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6">
            <FieldError>{errorMessage}</FieldError>
          </div>
        )}

        {currentStep === 1 ? (
          <form onSubmit={handleNextToPayment}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reason">Alasan Mengikuti Kelas</FieldLabel>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ceritakan tujuan belajar dan target yang ingin kamu capai (misal: persiapan kerja ke luar negeri, kebutuhan percakapan harian, atau sertifikasi)."
                  className="min-h-36"
                  required
                />
                <FieldDescription>
                  Jawaban ini membantu tim kami menyesuaikan arahan belajar sebelum kelas dimulai.
                </FieldDescription>
              </Field>

              <Button type="submit" size="lg" className="w-full font-bold">
                Lanjut ke Pembayaran
                <ArrowRight className="size-4" />
              </Button>
            </FieldGroup>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Petunjuk Pembayaran & Rekening */}
              <div className="rounded-xl border border-primary/20 bg-brand-mint/40 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="size-5 text-primary" />
                    <p className="font-bold text-foreground">Transfer Bank Manual</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-xs transition hover:bg-brand-mint active:scale-95"
                  >
                    {copiedAccount ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    <span>{copiedAccount ? "Tersalin!" : "Salin No. Rekening"}</span>
                  </button>
                </div>

                <div className="rounded-lg border border-border/80 bg-white p-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {manualPaymentAccount.bankName}
                  </p>
                  <p className="text-xl font-black tracking-wide text-foreground">
                    {manualPaymentAccount.accountNumber}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    a.n. {manualPaymentAccount.accountHolderName}
                  </p>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground leading-relaxed">
                  <p>1. Transfer biaya kelas sejumlah <strong className="text-foreground">{formatPrice(selectedPrice)}</strong> ke rekening di atas.</p>
                  <p>2. Simpan foto atau tangkapan layar bukti transfer yang jelas.</p>
                  <p>3. Upload file bukti di bawah dan klik Kirim Pendaftaran.</p>
                </div>
              </div>

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
                  Format file gambar (JPG, PNG) atau PDF, maksimal 1,5 MB.
                </FieldDescription>
                {paymentProof && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-brand-surface px-3 py-2 text-sm text-muted-foreground">
                    <FileUp className="size-4 text-primary" />
                    <span className="truncate font-medium text-foreground">{paymentProof.name}</span>
                  </div>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="senderBankName">Nama Bank / E-Wallet Pengirim</FieldLabel>
                  <Input
                    id="senderBankName"
                    type="text"
                    value={senderBankName}
                    onChange={(event) => setSenderBankName(event.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BSI, GoPay, Dana"
                  />
                  <FieldDescription>
                    Bank atau e-wallet yang kamu gunakan untuk transfer (opsional).
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="senderAccountName">Nama Pemilik Rekening Pengirim</FieldLabel>
                  <Input
                    id="senderAccountName"
                    type="text"
                    value={senderAccountName}
                    onChange={(event) => setSenderAccountName(event.target.value)}
                    placeholder="Contoh: Budi Santoso"
                  />
                  <FieldDescription>
                    Nama yang tertera pada rekening atau akun pengirim (opsional).
                  </FieldDescription>
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToStep1}
                  disabled={isSubmitting}
                  className="sm:w-1/3"
                >
                  <ArrowLeft className="size-4" />
                  Kembali
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 font-bold"
                >
                  {isSubmitting ? <Spinner /> : <UploadCloud className="size-4" />}
                  {isSubmitting ? "Mengirim Pendaftaran..." : "Kirim Pendaftaran"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </section>
    </div>
  )
}
