"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { LogIn, UserRound } from "lucide-react"

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
import { getUserProfile, isProfileComplete, loginWithEmail, type UserSession } from "@/features/auth/services/firebase-auth"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setReturnTo(getReturnToFromLocation())
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
      const session = await loginWithEmail(loginEmail, password)
      await continueAfterLogin(session)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login belum berhasil.")
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
            <h1 className="text-xl font-bold text-foreground">Welcome to LKP SlangTech</h1>
            <FieldDescription>
              Belum punya akun?{" "}
              <Link href={createAuthRedirectPath("/register", returnTo)}>Sign up</Link>
            </FieldDescription>
          </div>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          <Field>
            <FieldLabel htmlFor="email">Email atau Username</FieldLabel>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@example.com atau username guru"
              autoCapitalize="none"
              autoCorrect="off"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <LogIn className="size-4" />}
              Login
            </Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          <Field>
            <GoogleAuthButton onSuccess={continueAfterLogin} onError={setErrorMessage} />
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        Dengan melanjutkan, kamu menyetujui proses penyimpanan data profil untuk kebutuhan kelas LKP SlangTech.
      </FieldDescription>
    </div>
  )
}
