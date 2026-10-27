"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useLenis } from "lenis/react"
import { CalendarClock, GraduationCap, LayoutDashboard, LogOut, Menu, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearSession, getStoredSession, getUserProfile, type UserProfile, type UserSession } from "@/features/auth/services/firebase-auth"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const lenis = useLenis()
  const useSolidNav = scrolled || pathname !== "/"
  const isTeacher = profile?.role === "teacher"

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const syncSession = () => {
      const currentSession = getStoredSession()
      setSession(currentSession)
      if (currentSession) {
        getUserProfile(currentSession).then(setProfile).catch(() => null)
      } else {
        setProfile(null)
      }
    }

    syncSession()

    window.addEventListener("storage", syncSession)
    return () => window.removeEventListener("storage", syncSession)
  }, [])

  const scrollToSection = (id: string) => {
    if (id.startsWith("/")) {
      router.push(id)
      setMobileMenuOpen(false)
      return
    }

    const element = document.querySelector(id)
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -100 })
      } else {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      router.push(`/${id}`)
    }
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#why-us" },
    { label: "Our Class", href: "/classes" },
    { label: "Events", href: "/events" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ]

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setProfile(null)
    setMobileMenuOpen(false)
    router.push("/login")
  }

  const isLoggedIn = Boolean(session)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        useSolidNav ? "bg-brand-green-deep/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/mylogo.webp"
            alt="LKP SlangTech Logo"
            width={38}
            height={38}
            className="size-9 shrink-0 object-contain rounded-full"
            priority
          />
          <motion.span
            className="text-2xl font-black tracking-normal"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className={useSolidNav ? "text-white" : "text-brand-ink"}>LKP Slang</span>
            <motion.span
              className={useSolidNav ? "text-brand-lime" : "text-brand-ink"}
              animate={{
                textShadow: useSolidNav
                  ? ["0 0 10px rgba(217,249,157,0.35)", "0 0 20px rgba(217,249,157,0.55)", "0 0 10px rgba(217,249,157,0.35)"]
                  : "none",
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Tech
            </motion.span>
          </motion.span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item, i) => (
            <motion.button
              key={item.label}
              onClick={() => scrollToSection(item.href)}
              className={`text-sm font-medium tracking-wide transition-colors relative ${
                useSolidNav ? "text-white/80 hover:text-brand-lime" : "text-foreground/75 hover:text-foreground"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
              <motion.span
                className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left ${
                  useSolidNav ? "bg-brand-lime" : "bg-foreground"
                }`}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </motion.button>
          ))}
        </div>

        {isLoggedIn ? (
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-brand-green-strong">
                  {isTeacher ? <GraduationCap className="size-4" /> : <LayoutDashboard className="size-4" />}
                  {isTeacher ? "Portal Guru" : "Dashboard"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/home" className="cursor-pointer">
                    {isTeacher ? <CalendarClock className="size-4" /> : <LayoutDashboard className="size-4" />}
                    {isTeacher ? "Jadwal Mengajar" : "Dashboard"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Link href="/register" className="hidden md:block">
            <motion.span
              className={`relative block overflow-hidden rounded-full px-6 py-2.5 text-sm font-bold tracking-wide shadow-sm ${
                useSolidNav
                  ? "bg-primary text-primary-foreground"
                  : "border border-foreground/15 bg-white/80 text-foreground backdrop-blur"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.span
                className={`absolute inset-0 ${useSolidNav ? "bg-white/30" : "bg-transparent"}`}
                animate={{
                  boxShadow: [
                    useSolidNav ? "0 0 20px rgba(11,135,65,0.18)" : "0 0 14px rgba(17,24,39,0.08)",
                    useSolidNav ? "0 0 36px rgba(11,135,65,0.28)" : "0 0 22px rgba(17,24,39,0.12)",
                    useSolidNav ? "0 0 20px rgba(11,135,65,0.18)" : "0 0 14px rgba(17,24,39,0.08)",
                  ],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              />
              <span className="relative z-10">Daftar Sekarang</span>
            </motion.span>
          </Link>
        )}

        <motion.button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className={useSolidNav ? "text-white" : "text-brand-ink"} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className={useSolidNav ? "text-white" : "text-brand-ink"} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="md:hidden bg-brand-green-deep/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-white/80 hover:text-brand-lime text-lg font-medium py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
              {isLoggedIn ? (
                <motion.div
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                  >
                    {isTeacher ? <GraduationCap className="size-4" /> : <LayoutDashboard className="size-4" />}
                    {isTeacher ? "Portal Guru (Jadwal)" : "Dashboard"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white/90 transition hover:bg-white/10"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm tracking-wide mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center">
                    Daftar Sekarang
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
