import { Navigation } from "@/components/layout/navigation"
import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 pt-28 md:p-10 md:pt-32">
      <Navigation />
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  )
}
