import type { Metadata } from "next"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Daftar Akun Baru | LKP SlangTech",
  description:
    "Daftar akun LKP SlangTech dan mulai belajar bahasa Mandarin, English, Japanese, dan Cantonese bersama tutor berpengalaman.",
}

export default function RegisterPage() {
  return (
    <AuthLayout mode="register">
      <RegisterForm />
    </AuthLayout>
  )
}
