"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const partners = [
  {
    name: "Hing Shing Manpower Agency Limited",
    description:
      "Mitra yang mendukung kebutuhan manpower dan peluang kerja lintas negara.",
    tag: "Manpower & Placement",
    logoType: "image" as const,
    logoSrc: "/images/hing-shing.webp",
  },
  {
    name: "Full Win Employment Agency",
    description:
      "Mitra agensi penempatan yang membantu kesiapan kerja dan koneksi tenaga kerja.",
    tag: "Employment Agency",
    logoType: "avatar" as const,
    avatarText: "FW",
  },
]

export function PartnersSection() {
  return (
    <section id="partners" className="relative overflow-hidden bg-brand-green-deep py-20">
      {/* Background gradients exactly like the previous section */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,255,80,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_34%)]" />
      <div className="absolute inset-0 bg-brand-green-deep/85" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          className="mx-auto mb-14 max-w-2xl text-center space-y-4"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-lime backdrop-blur">
            Partner
          </span>

          <h2 className="text-3xl font-black tracking-normal text-white md:text-5xl">
            Partner <span className="text-brand-lime">Kami</span>
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Bersama mitra yang mendukung program belajar, komunitas, dan pertumbuhan siswa SlangTech.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white p-6 sm:p-7 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-brand-lime/40"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  {partner.logoType === "image" ? (
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-white p-2 shadow-2xs group-hover:border-primary/30 transition-colors">
                      <Image
                        src={partner.logoSrc}
                        alt={partner.name}
                        width={64}
                        height={64}
                        className="size-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-primary border border-primary/20 font-black text-xl tracking-wider shadow-2xs">
                      {partner.avatarText}
                    </div>
                  )}

                  <span className="inline-flex rounded-full bg-brand-mint/70 px-3 py-1 text-xs font-semibold text-primary border border-primary/15">
                    {partner.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {partner.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {partner.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
