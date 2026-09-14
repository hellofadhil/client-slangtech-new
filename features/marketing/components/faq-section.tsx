"use client"

import { motion } from "framer-motion"
import { HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    id: "faq-1",
    question: "Belum punya dasar sama sekali, apa tetap bisa ikut?",
    answer:
      "Tenang aja, kurikulum kita dirancang khusus buat pemula. Kamu bakal diajarin pelan-pelan dari dasar banget, mulai dari pelafalan sampai kosakata sehari-hari.",
  },
  {
    id: "faq-2",
    question: "Kerjaan saya sistem shift, jadwal belajarnya fleksibel nggak?",
    answer:
      "Fleksibel banget. Kita nyediain kelas malam dan akhir pekan. Kalau terpaksa bolos, kamu tetap bisa ngejar materi lewat rekaman kelas.",
  },
  {
    id: "faq-3",
    question: "Pilihan bahasanya ada apa aja?",
    answer:
      "Saat ini SlangTech fokus di 4 bahasa: Mandarin, Kanton (Cantonese), Inggris, dan Jepang.",
  },
  {
    id: "faq-4",
    question: "Sistem belajarnya via apa?",
    answer:
      "Full interaktif! Kita pakai Zoom/Google Meet buat praktik langsung dua arah. Kamu juga bakal dapet modul digital dan masuk grup diskusi eksklusif.",
  },
  {
    id: "faq-5",
    question: "Oke, saya tertarik. Cara daftarnya gimana?",
    answer:
      "Gampang banget. Langsung aja klik tombol kelas pilihanmu, atau klik tombol WhatsApp di bawah buat konsultasi gratis dulu sama admin kita.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="relative overflow-hidden bg-brand-surface py-20 border-t border-border/60">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <motion.div
          className="mx-auto mb-14 max-w-2xl text-center space-y-4"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold tracking-wide text-primary shadow-2xs">
            <HelpCircle className="size-3.5 text-primary" />
            Pertanyaan Umum
          </div>

          <h2 className="text-3xl font-black leading-[1.05] tracking-normal text-foreground md:text-5xl">
            Pertanyaan Umum <span className="text-primary">(FAQ)</span>
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Punya pertanyaan seputar kelas, jadwal, atau metode belajar? Temukan jawaban ringkasnya di bawah ini.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible defaultValue="faq-1" className="space-y-3.5">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-xl border border-border bg-card px-5 sm:px-6 shadow-2xs transition-all duration-200 hover:border-primary/40 data-[state=open]:border-primary/50 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="py-5 text-base sm:text-lg font-bold text-foreground transition-colors hover:no-underline hover:text-primary text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 pt-1 text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Quick Help Callout */}
          <div className="mt-10 rounded-2xl border border-border/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="text-base font-bold text-foreground">Masih ada pertanyaan lain?</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Konsultasikan langsung kebutuhan belajarmu dengan tim SlangTech.
              </p>
            </div>
            <Link
              href="https://api.whatsapp.com/send/?phone=6282122210770&text&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-brand-green-strong transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <MessageCircle className="size-4" />
              Tanya via WhatsApp
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
