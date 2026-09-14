import { Navigation } from "@/components/layout/navigation"
import { HeroSection } from "@/features/marketing/components/hero-section"
import { WhyChooseUsSection } from "@/features/marketing/components/why-choose-us-section"
import { PartnersSection } from "@/features/marketing/components/partners-section"
import { TestimonialSection } from "@/features/marketing/components/testimonial-section"
import { FaqSection } from "@/features/marketing/components/faq-section"
import { ContactSection } from "@/features/marketing/components/contact-section"
import { Footer } from "@/components/layout/footer"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <WhyChooseUsSection />
      <PartnersSection />
      <TestimonialSection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
