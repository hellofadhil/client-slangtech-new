import { ArrowUpRight } from "lucide-react"
import type { InformationResource } from "../types"

function getHostName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Tautan eksternal"
  }
}

export function InformationCard({ item }: { item: InformationResource }) {
  const host = getHostName(item.url)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between rounded-xl border border-border bg-white p-5 transition-all duration-200 hover:border-primary/60 hover:bg-brand-surface/40 hover:shadow-sm"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">
            {item.organization}
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <h3 className="mt-2 text-base sm:text-lg font-bold text-foreground transition-colors group-hover:text-primary leading-snug">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] text-foreground/75 group-hover:text-primary transition-colors">
          {host}
        </span>
        <span className="font-medium text-[11px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
          {item.badge}
        </span>
      </div>
    </a>
  )
}
