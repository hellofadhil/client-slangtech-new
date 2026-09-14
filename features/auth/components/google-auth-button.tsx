"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { saveSession, type UserSession } from "@/features/auth/services/firebase-auth"

type GoogleAuthButtonProps = {
  className?: string
  onSuccess: (session: UserSession) => Promise<void> | void
  onError: (message: string) => void
}

type FirebaseClientConfig = {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

type FirebaseUser = {
  uid: string
  email: string | null
  displayName: string | null
  refreshToken: string
  getIdToken: () => Promise<string>
  getIdTokenResult: () => Promise<{
    expirationTime: string
  }>
}

type GoogleAuthProvider = {
  addScope: (scope: string) => void
}

type FirebaseAuth = {
  signInWithPopup: (provider: GoogleAuthProvider) => Promise<{
    user: FirebaseUser | null
  }>
}

declare global {
  interface Window {
    firebase?: {
      apps: unknown[]
      initializeApp: (config: FirebaseClientConfig) => void
      auth: {
        (): FirebaseAuth
        GoogleAuthProvider: new () => GoogleAuthProvider
      }
    }
  }
}

const FIREBASE_APP_SCRIPT_ID = "firebase-app-compat"
const FIREBASE_AUTH_SCRIPT_ID = "firebase-auth-compat"
const FIREBASE_SCRIPT_VERSION = "10.14.1"

function getFirebaseClientConfig(): FirebaseClientConfig {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

  // Pastikan authDomain mengarah ke handler resmi Firebase (<projectId>.firebaseapp.com)
  const authDomain =
    rawAuthDomain && !rawAuthDomain.includes("slangtech.asia")
      ? rawAuthDomain
      : projectId
        ? `${projectId}.firebaseapp.com`
        : "lkp-slangtech.firebaseapp.com"

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

let firebaseAuthPromise: Promise<FirebaseAuth> | null = null

function loadScript(id: string, src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(id) as HTMLScriptElement | null

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve()
        return
      }

      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Firebase Auth belum bisa dimuat.")),
        { once: true },
      )
      return
    }

    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error("Firebase Auth belum bisa dimuat."))
    }
    document.head.appendChild(script)
  })
}

async function waitForFirebaseAuth(timeoutMs = 10000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (typeof window !== "undefined" && typeof window.firebase?.auth === "function") {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error("Firebase Auth belum siap.")
}

async function loadFirebaseAuth(): Promise<FirebaseAuth> {
  if (typeof window !== "undefined" && typeof window.firebase?.auth === "function") {
    if (window.firebase.apps.length === 0) {
      window.firebase.initializeApp(getFirebaseClientConfig())
    }
    return window.firebase.auth()
  }

  if (firebaseAuthPromise) {
    return firebaseAuthPromise
  }

  firebaseAuthPromise = (async () => {
    await loadScript(
      FIREBASE_APP_SCRIPT_ID,
      `https://www.gstatic.com/firebasejs/${FIREBASE_SCRIPT_VERSION}/firebase-app-compat.js`,
    )
    await loadScript(
      FIREBASE_AUTH_SCRIPT_ID,
      `https://www.gstatic.com/firebasejs/${FIREBASE_SCRIPT_VERSION}/firebase-auth-compat.js`,
    )

    await waitForFirebaseAuth()

    if (!window.firebase) {
      throw new Error("Firebase Auth belum siap.")
    }

    if (window.firebase.apps.length === 0) {
      window.firebase.initializeApp(getFirebaseClientConfig())
    }

    return window.firebase.auth()
  })().catch((error) => {
    firebaseAuthPromise = null
    throw error
  })

  return firebaseAuthPromise
}

async function createGoogleSession(auth: FirebaseAuth) {
  if (!window.firebase) {
    throw new Error("Firebase Auth belum siap.")
  }

  const provider = new window.firebase.auth.GoogleAuthProvider()
  provider.addScope("email")
  provider.addScope("profile")

  const credential = await auth.signInWithPopup(provider)
  const user = credential.user

  if (!user) {
    throw new Error("Login Google belum berhasil.")
  }

  const [idToken, tokenResult] = await Promise.all([user.getIdToken(), user.getIdTokenResult()])
  const session: UserSession = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    idToken,
    refreshToken: user.refreshToken,
    expiresAt: new Date(tokenResult.expirationTime).getTime(),
    provider: "google.com",
  }

  saveSession(session)
  return session
}

export function GoogleAuthButton({ className, onSuccess, onError }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const authRef = useRef<FirebaseAuth | null>(null)

  useEffect(() => {
    let isMounted = true

    loadFirebaseAuth()
      .then((auth) => {
        if (isMounted) {
          authRef.current = auth
          setIsReady(true)
        }
      })
      .catch((error: unknown) => {
        console.warn("Background Firebase Auth preload:", error)
      })

    return () => {
      isMounted = false
    }
  }, [onError])

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const auth = authRef.current ?? (await loadFirebaseAuth())
      authRef.current = auth
      setIsReady(true)

      const session = await createGoogleSession(auth)
      await onSuccess(session)
    } catch (error) {
      const message = (() => {
        if (typeof error === "object" && error !== null && "code" in error) {
          const code = String((error as { code: unknown }).code)
          if (code === "auth/popup-closed-by-user") {
            return "Jendela login Google ditutup sebelum selesai."
          }
          if (code === "auth/popup-blocked") {
            return "Pop-up login diblokir browser. Mohon izinkan pop-up untuk situs ini."
          }
          if (code === "auth/unauthorized-domain") {
            return "Domain belum diizinkan di Firebase Console (Authentication > Settings > Authorized domains)."
          }
          if (code === "auth/cancelled-popup-request") {
            return "Permintaan login sebelumnya dibatalkan. Silakan coba lagi."
          }
        }
        if (error instanceof Error) {
          return error.message
        }
        return "Login Google belum berhasil. Silakan coba lagi."
      })()
      onError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full bg-white", className)}
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? <Spinner /> : <GoogleMark />}
      Masuk dengan Google
    </Button>
  )
}
