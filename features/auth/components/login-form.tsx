"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  LogIn,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react"

import { GoogleAuthButton } from "@/features/auth/components/google-auth-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createAuthRedirectPath, getReturnToFromLocation } from "@/features/auth/services/auth-redirect"
import { cn } from "@/lib/utils"
import {
  getUserProfile,
  isProfileComplete,
  loginWithEmail,
  type UserSession,
} from "@/features/auth/services/firebase-auth"

const SAVED_LOGIN_KEY = "slangtech_saved_login_email"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setReturnTo(getReturnToFromLocation())

    // Load saved email if remembered
    try {
      const savedEmail = window.localStorage.getItem(SAVED_LOGIN_KEY)
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch {
      // Ignore localStorage error if cookies/storage are disabled
    }
  }, [])

  const continueAfterLogin = useCallback(
    async (session: UserSession) => {
      const nextPath = returnTo ?? getReturnToFromLocation()
      const profile = await getUserProfile(session).catch(() => null)

      if (!isProfileComplete(profile)) {
        router.push(createAuthRedirectPath("/profile/setup", nextPath))
        return
      }

      router.push(nextPath ?? "/home")
    },
    [returnTo, router],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const rawInput = email.trim().toLowerCase()
      const loginEmail = rawInput.includes("@") ? rawInput : `${rawInput}@slangtech.com`

      // Save or clear remembered email
      try {
        if (rememberMe) {
          window.localStorage.setItem(SAVED_LOGIN_KEY, email.trim())
        } else {
          window.localStorage.removeItem(SAVED_LOGIN_KEY)
        }
      } catch {
        // Ignore localStorage error
      }

      const session = await loginWithEmail(loginEmail, password)
      await continueAfterLogin(session)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Email atau password belum sesuai.")
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
            Selamat Datang Kembali
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href={createAuthRedirectPath("/register", returnTo)}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Daftar gratis di sini
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
            <p className="font-semibold text-red-900">Kendala Masuk</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Google Quick Sign-in */}
      <GoogleAuthButton
        onSuccess={continueAfterLogin}
        onError={setErrorMessage}
        label="Masuk dengan Google"
      />

      {/* Modern Separator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>
        <div className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          atau masuk dengan email
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email or Username */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-foreground">
            Email atau Username Guru
          </label>
          <div className="relative flex items-center">
            <Mail className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (errorMessage) setErrorMessage("")
              }}
              placeholder="nama@email.com atau username guru"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
              className="h-11 pl-10 pr-3.5 text-sm bg-background/50 border-border/90 rounded-lg focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-semibold text-foreground">
              Password
            </label>

            {/* Forgot Password Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline focus:outline-none"
                >
                  Lupa password?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <HelpCircle className="size-5 text-primary" />
                    Bantuan Akun & Lupa Password
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground pt-1.5 leading-relaxed">
                    Untuk menjaga keamanan data siswa dan guru, pengaturan ulang akun diverifikasi langsung oleh tim admin SlangTech.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    Bantuan Langsung via WhatsApp
                  </p>
                  <p className="leading-relaxed">
                    Sampaikan email atau nama lengkap yang terdaftar ke admin kami. Tim kami akan segera membantu memulihkan akses akun Anda.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="https://api.whatsapp.com/send/?phone=6282122210770&text=Halo%20Admin%20SlangTech,%20saya%20butuh%20bantuan%20reset%20password%20akun%20saya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageSquare className="size-4" />
                    Hubungi Admin WhatsApp
                  </a>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative flex items-center">
            <Lock className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (errorMessage) setErrorMessage("")
              }}
              placeholder="Masukkan password Anda"
              autoComplete="current-password"
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
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
            />
            <span>Ingat email saya di perangkat ini</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-11 w-full rounded-lg bg-primary text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.99]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span>Memproses Masuk...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="size-4" />
              <span>Masuk ke Akun</span>
            </div>
          )}
        </Button>
      </form>

      {/* Security Reassurance */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" />
        <span>Autentikasi aman terintegrasi Firebase Security</span>
      </div>
    </div>
  )
}
