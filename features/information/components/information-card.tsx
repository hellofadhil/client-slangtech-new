import { ArrowUpRight, Building2, Globe, ShieldCheck, Briefcase, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { InformationResource } from "../types"

const categoryMeta = {
  imigrasi: {
    icon: Globe,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Keimigrasian & Visa",
  },
  depnaker: {
    icon: Briefcase,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Ketenagakerjaan & BP2MI",
  },
  sertifikasi: {
    icon: GraduationCap,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Ujian Bahasa Resmi",
  },
  lainnya: {
    icon: Building2,
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Informasi Terkait",
  },
}

export function InformationCard({ item }: { item: InformationResource }) {
  const meta = categoryMeta[item.category] || categoryMeta.lainnya
  const IconComponent = meta.icon

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {/* Top accent line if featured */}
      {item.featured && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-lime to-primary" />
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <IconComponent className="size-5" />
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`font-semibold text-xs ${meta.badgeColor}`}>
              {item.badge || meta.label}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="size-3.5 text-primary" />
            {item.organization}
          </p>
          <h3 className="mt-1.5 text-lg font-black text-foreground group-hover:text-primary transition-colors leading-snug">
            {item.title}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/60">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-surface py-2.5 px-4 text-xs sm:text-sm font-bold text-foreground transition-all duration-200 hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white"
        >
          <span>Kunjungi Portal Resmi</span>
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </article>
  )
}
