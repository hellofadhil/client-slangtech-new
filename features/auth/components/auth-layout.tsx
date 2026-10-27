"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Navigation } from "@/components/layout/navigation"
import { createAuthRedirectPath, getReturnToFromLocation } from "@/features/auth/services/auth-redirect"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  children: React.ReactNode
  mode: "login" | "register"
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const pathname = usePathname()
  const [returnTo, setReturnTo] = useState<string | null>(null)

  useEffect(() => {
    setReturnTo(getReturnToFromLocation())
  }, [pathname])

  return (
    <div className="relative min-h-svh bg-background flex flex-col justify-between overflow-x-hidden">
      {/* Background soft ambient accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-gradient-to-br from-primary/10 via-brand-mint/40 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-[450px] rounded-full bg-gradient-to-tl from-emerald-100/50 via-teal-50/20 to-transparent blur-3xl opacity-60" />

      <Navigation />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-28 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          {/* Main Container Card */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl shadow-neutral-900/5 transition-all">
            {/* Mode Switcher Tabs */}
            <div className="mb-6 flex rounded-xl border border-border/80 bg-muted/50 p-1">
              <Link
                href={createAuthRedirectPath("/login", returnTo)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-medium transition-all",
                  mode === "login"
                    ? "bg-white text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Masuk Akun
              </Link>
              <Link
                href={createAuthRedirectPath("/register", returnTo)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-center text-xs sm:text-sm font-medium transition-all",
                  mode === "register"
                    ? "bg-white text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Daftar Baru
              </Link>
            </div>

            {/* Form Component */}
            {children}
          </div>

          {/* Quick Help Link below Card */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Butuh bantuan atau kendala pendaftaran?{" "}
            <a
              href="https://api.whatsapp.com/send/?phone=6282122210770&text=Halo%20Admin%20SlangTech,%20saya%20butuh%20bantuan%20terkait%20akun%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:underline"
            >
              Chat Admin via WhatsApp
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
