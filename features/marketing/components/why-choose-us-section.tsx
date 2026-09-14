"use client"

import { motion, useInView } from "framer-motion"
import { BookOpenCheck, CalendarCheck2, Target, UsersRound } from "lucide-react"
import { useRef } from "react"

const reasons = [
  {
    icon: BookOpenCheck,
    title: "Materi Praktis",
    description: "Belajar lewat percakapan sehari-hari, kebutuhan kerja, dan contoh situasi nyata yang langsung bisa kamu pakai.",
  },
  {
    icon: UsersRound,
    title: "Tutor Berpengalaman",
    description: "Dibimbing oleh pengajar yang sabar, jelas, dan membantu kamu memahami bahasa tanpa metode yang kaku.",
  },
  {
    icon: CalendarCheck2,
    title: "Jadwal Fleksibel",
    description: "Atur ritme belajar sesuai aktivitasmu. Cocok untuk pelajar, pekerja, pemula, sampai profesional.",
  },
  {
    icon: Target,
    title: "Progress Terukur",
    description: "Setiap sesi punya target yang jelas, jadi kamu tahu kemampuan apa yang berkembang dari waktu ke waktu.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 20,
    },
  },
}

export function WhyChooseUsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="why-us" className="relative overflow-hidden bg-brand-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2 className="mt-2 text-3xl font-black tracking-normal text-foreground md:text-5xl">
            Alasan Memilih <span className="text-primary">Kami</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-8 text-muted-foreground text-lg">
            Pengalaman belajar yang dibuat rapi, manusiawi, dan fokus pada hasil komunikasi nyata.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {reasons.map((reason) => (
            <motion.article
              key={reason.title}
              variants={itemVariants}
              whileHover={{
                y: -6,
                transition: { type: "spring", stiffness: 350, damping: 20 },
              }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Subtle top accent line on hover */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-5">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-brand-mint text-primary border border-primary/15 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-xs">
                    <reason.icon className="size-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                  {reason.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
