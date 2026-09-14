"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

export function HeroSection() {
  const ref = useRef(null)
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const rawTextX1 = useTransform(scrollYProgress, (v) => (isMobile ? 0 : v * -60))
  const textX1 = useSpring(rawTextX1, springConfig)

  const rawTextX2 = useTransform(scrollYProgress, (v) => (isMobile ? 0 : v * 60))
  const textX2 = useSpring(rawTextX2, springConfig)

  const rawOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const opacity = useSpring(rawOpacity, springConfig)

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-background noise-overlay"
    >
      {/* Fixed navbar height background */}
      <div className="absolute inset-x-0 top-0 h-20 bg-brand-mint/70" />

      {/* Background glow circle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] md:size-[650px] rounded-full bg-brand-mint/60 blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-28 md:pt-36 md:pb-36 lg:pt-40 lg:pb-36 text-center">
        <motion.div style={{ opacity }} className="space-y-6 md:space-y-8 flex flex-col items-center">
          <div className="space-y-2 md:space-y-3 overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-black tracking-normal text-foreground leading-[0.96]">
              <motion.span
                style={{ x: textX1 }}
                className="block overflow-hidden"
              >
                <motion.span
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  className="inline-block"
                >
                  Tingkatkan Bahasamu
                </motion.span>
              </motion.span>
              <motion.span
                style={{ x: textX2 }}
                className="block overflow-hidden text-[#075f38]"
              >
                <motion.span
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                  className="inline-block"
                >
                  Dengan Percaya Diri
                </motion.span>
              </motion.span>
            </h1>
            <motion.p
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              custom={3}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed tracking-normal pt-3 max-w-xl mx-auto"
            >
              Cocok untuk pemula, pekerja, maupun siapa pun yang ingin lebih lancar berkomunikasi.
            </motion.p>
          </div>

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap justify-center gap-3 pt-2"
          >
            <Link href="/classes">
              <motion.span
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 group relative overflow-hidden shadow-md shadow-primary/25 hover:bg-brand-green-strong transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Lihat Kelas</span>
                <motion.span
                  className="relative z-10 inline-flex"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </motion.span>
            </Link>
            <Link
              href="https://docs.google.com/forms/d/1oQ2ddspZPI6we4ZE8ZL5HkmSwW616FBFGS607hK1EDs/viewform?edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.span
                className="block border border-border bg-white text-foreground px-6 py-3 rounded-full font-bold text-sm tracking-wide relative overflow-hidden shadow-sm"
                whileHover={{ scale: 1.02, backgroundColor: "#EAFBEA", color: "#0A7F3D" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Konsultasi
              </motion.span>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={5}
            className="flex flex-wrap items-center justify-center gap-2.5 pt-3 max-w-xl mx-auto"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Pilihan Bahasa:
            </span>
            {["Mandarin", "Cantonese", "English", "Japanese"].map((language, i) => (
              <motion.div
                key={language}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-3.5 py-1 text-sm font-medium text-foreground shadow-2xs backdrop-blur-xs transition-colors hover:border-primary/50 hover:bg-brand-mint/40"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
              >
                <span className="size-1.5 rounded-full bg-primary" />
                {language}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
