import type { Metadata } from "next"
import { Footer } from "@/components/layout/footer"
import { Navigation } from "@/components/layout/navigation"
import { InformationPageContent } from "@/features/information/components/information-page-content"
import { getInformationResources } from "@/features/information/services/information"

export const metadata: Metadata = {
  title: "Pusat Informasi & Tautan Resmi Pemerintah - LKP SlangTech",
  description:
    "Akses portal resmi Ditjen Imigrasi, Layanan Paspor Online, Kemenaker SIAPkerja, BP2MI, dan informasi sertifikasi bahasa internasional resmi.",
}

export const dynamic = "force-dynamic"

export default async function InformasiPage() {
  const resources = await getInformationResources()

  return (
    <main className="min-h-screen bg-background pt-24 sm:pt-28">
      <Navigation />
      <InformationPageContent initialResources={resources} />
      <Footer />
    </main>
  )
}
