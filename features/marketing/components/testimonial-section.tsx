"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/magicui/marquee"

const reviews = [
  {
    name: "Eva Wahyuningtyas",
    username: "Calon Pekerja Migran Indonesia",
    body: "SlangTech sangat membantu proses belajar Mandarin saya. Laoshi-nya sabar dan sangat kompeten.",
    img: "https://avatar.vercel.sh/eva",
  },
  {
    name: "Hanik Asrofah",
    username: "Pekerja Migran Indonesia, Hongkong",
    body: "Dulu saya kesulitan berkomunikasi dalam bahasa Inggris. Dengan SlangTech, saya jadi lebih percaya diri, bisa belajar fleksibel, hemat biaya, dan dari mana saja.",
    img: "https://avatar.vercel.sh/hanik",
  },
  {
    name: "Elia Zuzana",
    username: "Hongkong",
    body: "Saya belajar bahasa Kanton di SlangTech dan sangat suka. Gurunya ramah, sabar, dan cara mengajarnya menyenangkan.",
    img: "https://avatar.vercel.sh/elia",
  },
  {
    name: "Andayani",
    username: "Buruh Migran Indonesia",
    body: "SlangTech membantu saya upgrade skill walau ada keterbatasan sebagai BMI. Saya merasa sangat terbantu.",
    img: "https://avatar.vercel.sh/andayani",
  },
  {
    name: "Hanik",
    username: "Buruh Migran Indonesia",
    body: "Setelah ikut 4x pertemuan kelas bahasa Inggris di SlangTech, saya kembali semangat belajar dan lebih percaya diri berbicara.",
    img: "https://avatar.vercel.sh/hanik-bmi",
  },
  {
    name: "Rina Marlina",
    username: "Pekerja Migran Indonesia, Taiwan",
    body: "Belajar bahasa di SlangTech seru dan fleksibel. Kosakata baru langsung dipraktikkan, bikin percakapan kerja jadi jauh lebih lancar.",
    img: "https://avatar.vercel.sh/rina",
  },
]

const firstRow = reviews.slice(0, 3)
const secondRow = reviews.slice(3, 6)

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <figure
      className={cn(
        "relative flex h-full w-[310px] sm:w-[350px] flex-col justify-between cursor-pointer overflow-hidden rounded-xl border p-5 shadow-2xs transition-all duration-300",
        // light styles
        "border-border bg-card hover:border-primary/50 hover:shadow-md",
        // dark styles
        "dark:border-white/10 dark:bg-card dark:hover:border-primary/60"
      )}
    >
      <div>
        <div className="flex flex-row items-center gap-3">
          <img className="rounded-full ring-2 ring-primary/20" width="38" height="38" alt={name} src={img} />
          <div className="flex flex-col">
            <figcaption className="text-sm font-bold text-foreground">
              {name}
            </figcaption>
            <p className="text-xs font-medium text-muted-foreground">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">{body}</blockquote>
      </div>
    </figure>
  )
}

export function TestimonialSection() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-brand-surface py-20">
      <div className="mx-auto max-w-7xl px-6 mb-12">
        <motion.div
          className="mx-auto max-w-2xl text-center space-y-4"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold tracking-wide text-primary shadow-xs">
            <Heart className="size-3.5 fill-current" />
            Loved by learners
          </div>

          <h2 className="text-3xl font-black leading-[1.05] tracking-normal text-foreground md:text-5xl">
            What Our <span className="text-primary">Learners Say</span>
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Cerita nyata dari learners yang membangun confidence, pronunciation, dan kemampuan komunikasi mereka
            setiap hari.
          </p>
        </motion.div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:32s] py-2">
          {firstRow.map((review) => (
            <ReviewCard key={`r1-${review.name}-${review.username}`} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:32s] py-2">
          {secondRow.map((review) => (
            <ReviewCard key={`r2-${review.name}-${review.username}`} {...review} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export { TestimonialSection as MarqueeDemo }
export default TestimonialSection
