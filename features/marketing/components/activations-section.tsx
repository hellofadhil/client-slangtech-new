"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, Sparkles, Dumbbell, Building2, Calendar } from "lucide-react"

const activations = [
  {
    icon: Sparkles,
    title: "Free Tasting Events",
    description: "Experience LKP SlangTech at exclusive learning events near you.",
    cta: "Find Events",
  },
  {
    icon: Dumbbell,
    title: "Gyms & Studios",
    description: "Partner with us to fuel your fitness community.",
    cta: "Partner With Us",
  },
  {
    icon: Building2,
    title: "Corporate Offices",
    description: "Power up your workplace. Bulk orders available.",
    cta: "Get Quote",
  },
  {
    icon: Calendar,
    title: "Event Organizers",
    description: "Sponsor your next event with LKP SlangTech learning experiences.",
    cta: "Sponsor Event",
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
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
}

export function ActivationsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="distributors" className="relative py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-10"
        >
          <motion.span
            className="font-mono text-muted-foreground text-sm tracking-widest inline-block"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            ACTIVATIONS
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-normal mt-2 overflow-hidden">
            <motion.span
              className="inline-block"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.2 }}
            >
              EXPERIENCE{" "}
            </motion.span>
            <motion.span
              className="text-primary inline-block"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.3 }}
            >
              SLANGTECH
            </motion.span>
          </h2>
          <motion.p
            className="text-sm text-muted-foreground font-mono mt-2 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            From learning events to corporate partnerships, bring LKP SlangTech into your world.
          </motion.p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {activations.map((activation, index) => (
            <motion.div
              key={activation.title}
              variants={itemVariants}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 17 },
              }}
              className="group bg-card rounded-lg border border-border p-6 cursor-pointer relative overflow-hidden shadow-sm"
            >
              <motion.div
                className="absolute inset-0 bg-primary/0 group-hover:bg-primary"
                transition={{ duration: 0.4 }}
              />

              <div className="relative z-10">
                <motion.div
                  className="w-11 h-11 rounded-md bg-brand-mint flex items-center justify-center mb-4 group-hover:bg-white transition-colors duration-300"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <activation.icon className="w-5 h-5 text-primary group-hover:text-primary transition-colors duration-300" />
                </motion.div>

                <h3 className="text-lg font-black text-foreground group-hover:text-white tracking-normal mb-2 transition-colors duration-300">
                  {activation.title}
                </h3>
                <p className="text-muted-foreground group-hover:text-white/75 font-mono text-sm leading-7 mb-4 transition-colors duration-300">
                  {activation.description}
                </p>

                <motion.button
                  className="flex items-center gap-2 text-primary group-hover:text-white font-bold text-sm tracking-wide transition-colors duration-300"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {activation.cta}
                  <motion.span
                    className="inline-flex"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
