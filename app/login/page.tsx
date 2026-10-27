import type { Metadata } from "next"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = {
  title: "Masuk ke Akun | LKP SlangTech",
  description:
    "Masuk ke platform belajar bahasa online LKP SlangTech untuk mengakses materi dan kelas Mandarin, English, Japanese, dan Cantonese.",
}

export default function LoginPage() {
  return (
    <AuthLayout mode="login">
      <LoginForm />
    </AuthLayout>
  )
}
