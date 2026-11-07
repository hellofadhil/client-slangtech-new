"use client"

import { useState, useMemo } from "react"
import { Search, Globe, Briefcase, GraduationCap, Layers, ShieldCheck, ExternalLink, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { InformationCard } from "./information-card"
import type { InformationResource, InformationCategory } from "../types"

interface InformationPageContentProps {
  initialResources: InformationResource[]
}

const categories: Array<{ id: InformationCategory; label: string; icon: typeof Layers }> = [
  { id: "all", label: "Semua Informasi", icon: Layers },
  { id: "imigrasi", label: "Imigrasi & Paspor", icon: Globe },
  { id: "depnaker", label: "Depnaker & BP2MI", icon: Briefcase },
  { id: "sertifikasi", label: "Ujian Bahasa Resmi", icon: GraduationCap },
]

export function InformationPageContent({ initialResources }: InformationPageContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<InformationCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredResources = useMemo(() => {
    return initialResources.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.organization.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [initialResources, selectedCategory, searchQuery])

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-mint/60 px-4 py-1.5 text-xs font-black text-primary">
            <ShieldCheck className="size-4" />
            Portal Tautan Resmi & Regulasi
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-normal leading-tight">
            Pusat Informasi & Tautan Resmi Pemerintah
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Akses langsung ke portal resmi instansi pemerintah Republik Indonesia (Imigrasi, Kemnaker, BP2MI) serta lembaga penguji sertifikasi bahasa internasional untuk mendukung persiapan studi dan karier ke luar negeri Anda.
          </p>
        </div>

        {/* Disclaimer / Notice Alert */}
        <div className="mt-8 max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-gradient-to-r from-brand-mint/30 via-white to-brand-mint/30 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
          <Info className="size-5 shrink-0 text-primary mt-0.5" />
          <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            <strong className="font-bold text-foreground">Catatan Keamanan:</strong> Seluruh tautan di bawah mengarah langsung ke domain resmi instansi pemerintah (.go.id) dan badan sertifikasi resmi internasional. LKP SlangTech tidak memungut biaya apapun atas akses portal-portal resmi tersebut.
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white border border-border text-muted-foreground hover:bg-brand-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari info paspor, visa, siapkerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white text-xs sm:text-sm border-border"
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-10">
          {filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center max-w-lg mx-auto">
              <p className="text-base font-bold text-foreground">Informasi tidak ditemukan</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Coba gunakan kata kunci pencarian yang lain atau pilih kategori &quot;Semua Informasi&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-strong transition"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((item) => (
                <InformationCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
