"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react"

import { GoogleAuthButton } from "@/features/auth/components/google-auth-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createAuthRedirectPath, getReturnToFromLocation } from "@/features/auth/services/auth-redirect"
import { cn } from "@/lib/utils"
import {
  getUserProfile,
  isProfileComplete,
  registerWithEmail,
  type UserSession,
} from "@/features/auth/services/firebase-auth"

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setReturnTo(getReturnToFromLocation())
  }, [])

  const continueAfterGoogle = useCallback(
    async (session: UserSession) => {
      const nextPath = returnTo ?? getReturnToFromLocation()
      const existingProfile = await getUserProfile(session).catch(() => null)

      if (!isProfileComplete(existingProfile)) {
        router.push(createAuthRedirectPath("/profile/setup", nextPath))
        return
      }

      router.push(nextPath ?? "/home")
    },
    [returnTo, router],
  )

  const isLengthValid = password.length >= 6
  const isMatch = confirmPassword.length > 0 && password === confirmPassword
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (!isLengthValid) {
      setErrorMessage("Password minimal 6 karakter.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password belum sesuai.")
      return
    }

    setIsSubmitting(true)

    try {
      await registerWithEmail(email.trim().toLowerCase(), password)
      const nextPath = returnTo ?? getReturnToFromLocation()
      router.push(createAuthRedirectPath("/profile/setup", nextPath))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Pendaftaran belum berhasil. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Form Header */}
      <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Mulai Perjalanan Belajarmu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href={createAuthRedirectPath("/login", returnTo)}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/95 p-3.5 text-xs sm:text-sm text-red-800 shadow-2xs animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div className="flex-1 leading-relaxed">
            <p className="font-semibold text-red-900">Pendaftaran Terkendala</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Google Quick Sign-up */}
      <GoogleAuthButton
        onSuccess={continueAfterGoogle}
        onError={setErrorMessage}
        label="Daftar Cepat dengan Google"
      />

      {/* Modern Separator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>
        <div className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          atau daftar dengan email
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="block text-xs font-semibold text-foreground">
            Alamat Email Aktif
          </label>
          <div className="relative flex items-center">
            <Mail className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (errorMessage) setErrorMessage("")
              }}
              placeholder="nama@email.com"
              autoComplete="email"
              required
              className="h-11 pl-10 pr-3.5 text-sm bg-background/50 border-border/90 rounded-lg focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Digunakan untuk konfirmasi pendaftaran, materi kelas, dan tiket event.
          </p>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="block text-xs font-semibold text-foreground">
            Password Baru
          </label>
          <div className="relative flex items-center">
            <Lock className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (errorMessage) setErrorMessage("")
              }}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              required
              className="h-11 pl-10 pr-11 text-sm bg-background/50 border-border/90 rounded-lg focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Password requirement live hint */}
          <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
            <Check
              className={cn(
                "size-3.5 transition-colors",
                isLengthValid ? "text-primary font-bold" : "text-muted-foreground/40"
              )}
            />
            <span
              className={cn(
                "transition-colors",
                isLengthValid ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              Minimal 6 karakter
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-foreground">
            Ulangi Password
          </label>
          <div className="relative flex items-center">
            <Lock className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                if (errorMessage) setErrorMessage("")
              }}
              placeholder="Ketik ulang password di atas"
              autoComplete="new-password"
              required
              className="h-11 pl-10 pr-11 text-sm bg-background/50 border-border/90 rounded-lg focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
              aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Real-time Match Indicator */}
          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
              {isMatch ? (
                <>
                  <Check className="size-3.5 text-primary" />
                  <span className="text-primary font-medium">Password cocok</span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-amber-600" />
                  <span className="text-amber-600">Password belum sama</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || (confirmPassword.length > 0 && isMismatch)}
          className="mt-2 h-11 w-full rounded-lg bg-primary text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span>Mendaftarkan Akun...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="size-4" />
              <span>Daftar Akun Baru</span>
            </div>
          )}
        </Button>
      </form>

      {/* Terms Note */}
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Dengan mendaftar, kamu menyetujui ketentuan belajar dan penyimpanan data profil di platform pembelajaran LKP SlangTech.
      </p>
    </div>
  )
}
