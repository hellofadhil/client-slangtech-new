"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { UserPlus, UserRound } from "lucide-react"

import { GoogleAuthButton } from "@/features/auth/components/google-auth-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
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
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setReturnTo(getReturnToFromLocation())
  }, [])

  const continueAfterGoogle = useCallback(
    async (session: UserSession) => {
      const existingProfile = await getUserProfile(session).catch(() => null)

      if (!isProfileComplete(existingProfile)) {
        router.push("/profile/setup")
        return
      }

      router.push("/home")
    },
    [router],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")

    if (password.length < 6) {
      setErrorMessage("Password minimal 6 karakter.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password belum sama.")
      return
    }

    setIsSubmitting(true)

    try {
      await registerWithEmail(email.trim().toLowerCase(), password)
      router.push("/profile/setup")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Pendaftaran belum berhasil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-9 items-center justify-center rounded-md bg-brand-mint text-primary">
                <UserRound className="size-6" />
              </div>
              <span className="sr-only">LKP SlangTech</span>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Create your LKP SlangTech account</h1>
            <FieldDescription>
              Sudah punya akun?{" "}
              <Link href={createAuthRedirectPath("/login", returnTo)}>Login</Link>
            </FieldDescription>
          </div>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          <Field>
            <GoogleAuthButton onSuccess={continueAfterGoogle} onError={setErrorMessage} />
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="m@example.com"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password"
                required
              />
            </Field>
          </div>

          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <UserPlus className="size-4" />}
              Sign up
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
