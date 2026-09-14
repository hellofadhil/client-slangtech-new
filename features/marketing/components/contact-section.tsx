"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Youtube,
  Instagram,
  Facebook,
  Mail,
  PhoneCall,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react"

const contactMethods = [
  {
    name: "YouTube",
    handle: "@SlangTech215",
    href: "https://www.youtube.com/@SlangTech215",
    icon: Youtube,
    action: "Kunjungi",
  },
  {
    name: "Instagram",
    handle: "@slang.tech",
    href: "https://www.instagram.com/slang.tech/",
    icon: Instagram,
    action: "Kunjungi",
  },
  {
    name: "Facebook",
    handle: "SlangTech Official",
    href: "https://www.facebook.com/people/SlangTech/61575092977200/?_rdc=1&_rdr#",
    icon: Facebook,
    action: "Kunjungi",
  },
  {
    name: "Email",
    handle: "cs@slangtech.asia",
    href: "mailto:cs@slangtech.asia",
    icon: Mail,
    action: "Kirim Email",
  },
  {
    name: "Telepon / WhatsApp",
    handle: "+62 821-2221-0770",
    href: "https://api.whatsapp.com/send/?phone=6282122210770&text&type=phone_number&app_absent=0",
    icon: PhoneCall,
    action: "Hubungi",
  },
]

export function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-background py-20 border-t border-border/60">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          className="mx-auto mb-14 max-w-2xl text-center space-y-4"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-surface px-3.5 py-1.5 text-sm font-semibold tracking-wide text-primary shadow-2xs">
            <MessageCircle className="size-3.5 fill-current" />
            Contact
          </div>

          <h2 className="text-3xl font-black leading-[1.05] tracking-normal text-foreground md:text-5xl">
            Hubungi <span className="text-primary">Kami</span>
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Jangan ragu untuk menghubungi kami melalui platform mana pun di bawah ini. Kami akan senang mendengar dari Anda.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5 max-w-6xl mx-auto">
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            const isLast = index === contactMethods.length - 1
            return (
              <motion.a
                key={method.name}
                href={method.href}
                target={method.href.startsWith("mailto") ? undefined : "_blank"}
                rel={method.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 sm:p-5 text-center shadow-2xs transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                  isLast && "col-span-2 lg:col-span-1"
                )}
              >
                {/* Top subtle accent line */}
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex flex-col items-center">
                  <div className="mb-2 sm:mb-3 flex size-10 sm:size-12 items-center justify-center rounded-xl bg-brand-mint text-primary shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {method.name}
                  </span>
                  <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-bold text-foreground transition-colors group-hover:text-primary break-all sm:break-normal">
                    {method.handle}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-border/50 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-primary transition-all group-hover:gap-1.5">
                  <span>{method.action}</span>
                  <ArrowUpRight className="size-3 sm:size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
