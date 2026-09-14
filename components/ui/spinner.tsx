import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

type SpinnerProps = ComponentProps<"span"> & {
  label?: string
}

type LoadingCardProps = ComponentProps<"div"> & {
  title: string
  description?: string
  icon?: ReactNode
}

function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)}
      {...props}
    >
      <span className="absolute size-full rounded-full border-2 border-current/20" />
      <span className="absolute size-full animate-spin rounded-full border-2 border-transparent border-t-current border-r-current" />
      <span className="size-1.5 rounded-full bg-brand-lime shadow-[0_0_10px_rgba(217,249,157,0.9)]" />
    </span>
  )
}

function LoadingCard({ title, description, icon, className, ...props }: LoadingCardProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-white text-center shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative p-6">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-brand-mint">
          <div className="h-full w-1/2 animate-[loading-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>

        <div className="mx-auto flex size-16 items-center justify-center">
          <span className="relative flex size-14 items-center justify-center rounded-lg bg-brand-mint text-primary">
            <span className="absolute inset-0 animate-ping rounded-lg bg-primary/15" />
            <span className="absolute -right-1 top-2 size-2 rounded-full bg-brand-lime shadow-[0_0_12px_rgba(217,249,157,0.9)]" />
            <span className="relative flex size-10 items-center justify-center rounded-md bg-white shadow-sm">
              {icon ?? <Spinner className="size-6" />}
            </span>
          </span>
        </div>

        <p className="mt-4 text-sm font-bold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}

        <div className="mx-auto mt-4 flex w-20 justify-center gap-1.5" aria-hidden="true">
          <span className="size-1.5 animate-[loading-bounce_1s_ease-in-out_infinite] rounded-full bg-primary" />
          <span className="size-1.5 animate-[loading-bounce_1s_ease-in-out_0.15s_infinite] rounded-full bg-primary/70" />
          <span className="size-1.5 animate-[loading-bounce_1s_ease-in-out_0.3s_infinite] rounded-full bg-brand-lime" />
        </div>
      </div>
    </div>
  )
}

export { LoadingCard, Spinner }
