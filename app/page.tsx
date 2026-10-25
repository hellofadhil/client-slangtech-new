import { Navigation } from "@/components/layout/navigation"
import { HeroSection } from "@/features/marketing/components/hero-section"
import { AvailableClassesSection } from "@/features/classes/components/available-classes-section"
import { WhyChooseUsSection } from "@/features/marketing/components/why-choose-us-section"
import { PartnersSection } from "@/features/marketing/components/partners-section"
import { TestimonialSection } from "@/features/marketing/components/testimonial-section"
import { FaqSection } from "@/features/marketing/components/faq-section"
import { ContactSection } from "@/features/marketing/components/contact-section"
import { Footer } from "@/components/layout/footer"
import { getClasses } from "@/features/classes/services/classes"

export const dynamic = "force-dynamic"

export default async function Home() {
  const allClasses = await getClasses({ status: "active" })
  const previewClasses = [...allClasses]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <AvailableClassesSection classes={previewClasses} variant="home" />
      <WhyChooseUsSection />
      <PartnersSection />
      <TestimonialSection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
