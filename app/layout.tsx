import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { LenisProvider } from "@/components/providers/lenis-provider"
import ClickSpark from "@/components/effects/click-spark"
import { FloatingWhatsAppButton } from "@/components/layout/floating-whatsapp-button"
import { getSiteUrl } from "@/lib/site"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = getSiteUrl()
const logoUrl = "/images/mylogo.webp"
const absoluteLogoUrl = `${siteUrl}${logoUrl}`

const title = "LKP SlangTech | Tingkatkan Bahasamu Dengan Percaya Diri"

const description =
  "Platform belajar bahasa untuk membangun percaya diri dalam Mandarin, English, Japanese, dan Cantonese."

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "SlangTech",
  url: siteUrl,
  logo: absoluteLogoUrl,
  image: absoluteLogoUrl,
  description:
    "SlangTech adalah platform belajar bahasa online untuk kelas bahasa Inggris, Mandarin, Kanton, dan Jepang dengan tutor yang ramah dan berpengalaman.",
  email: "cs@slangtech.asia",
  sameAs: [
    "https://www.youtube.com/@SlangTech215",
    "https://www.instagram.com/slang.tech/",
    "https://www.facebook.com/people/SlangTech/61575092977200/?_rdc=1&_rdr#",
  ],
  areaServed: "ID",
  knowsAbout: [
    "English",
    "Mandarin",
    "Cantonese",
    "Japanese",
    "Online language classes",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
}

export const viewport: Viewport = {
  themeColor: "#0B8741",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: title,
    template: "%s | LKP SlangTech",
  },

  description,

  keywords: [
    "language learning",
    "LKP SlangTech",
    "SlangTech",
    "kelas bahasa online",
    "platform belajar bahasa",
    "belajar bahasa inggris online",
    "kelas bahasa inggris online",
    "belajar bahasa mandarin online",
    "kelas bahasa mandarin online",
    "belajar bahasa kanton",
    "kelas bahasa jepang online",
    "kursus bahasa online",
    "belajar speaking online",
    "kelas private bahasa",
    "kelas group bahasa",
    "Mandarin",
    "English",
    "Japanese",
    "Cantonese",
  ],

  applicationName: "SlangTech",

  icons: {
    icon: logoUrl,
    shortcut: logoUrl,
    apple: logoUrl,
  },

  openGraph: {
    title,
    description,
    siteName: "SlangTech",
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "SlangTech",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [logoUrl],
  },

  verification: {
    google: "4TNPsDd2YYZ08ICZt7ANHq2wpwEAJJJOtkOUfF02d0Y",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "education",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <ClickSpark
          sparkColor="#D9F99D"
          sparkSize={12}
          sparkRadius={20}
          sparkCount={8}
          duration={400}
          easing="ease-out"
        >
          <LenisProvider>
            {children}
            <FloatingWhatsAppButton />
          </LenisProvider>
        </ClickSpark>

        <Analytics />
      </body>
    </html>
  )
}