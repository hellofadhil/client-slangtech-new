"use client"

import { useState, useMemo } from "react"
import { Search, Globe, Briefcase, GraduationCap, Layers } from "lucide-react"
import { Input } from "@/components/ui/input"
import { InformationCard } from "./information-card"
import type { InformationResource, InformationCategory } from "../types"

interface InformationPageContentProps {
  initialResources: InformationResource[]
}

const categories: Array<{ id: InformationCategory; label: string; icon: typeof Layers }> = [
  { id: "all", label: "Semua", icon: Layers },
  { id: "imigrasi", label: "Imigrasi & Paspor", icon: Globe },
  { id: "depnaker", label: "Kemnaker & BP2MI", icon: Briefcase },
  { id: "sertifikasi", label: "Sertifikasi Bahasa", icon: GraduationCap },
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
    <div className="py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Informasi & Tautan Penting
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Kumpulan rujukan situs Imigrasi, Kemnaker, BP2MI, dan lembaga sertifikasi bahasa untuk keperluan paspor, visa, serta kerja ke luar negeri.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 w-full md:w-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-white border border-border text-muted-foreground hover:bg-brand-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari layanan atau instansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-white text-xs border-border"
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-6">
          {filteredResources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center max-w-md mx-auto">
              <p className="text-sm font-bold text-foreground">Tidak ada hasil yang sesuai</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coba gunakan kata kunci lain atau pilih tab Semua.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-strong transition-colors"
              >
                Reset pencarian
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
