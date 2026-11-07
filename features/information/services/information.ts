import type { InformationResource, InformationCategory } from "../types"

export const DEFAULT_INFORMATION_RESOURCES: InformationResource[] = [
  // ==========================================
  // IMIGRASI & PASPOR
  // ==========================================
  {
    id: "imigrasi-m-paspor",
    title: "Aplikasi M-Paspor",
    organization: "Ditjen Imigrasi",
    category: "imigrasi",
    description:
      "Pendaftaran antrean pembuatan dan penggantian paspor secara online sebelum datang ke kantor imigrasi.",
    url: "https://antrian.imigrasi.go.id/",
    badge: "Layanan Paspor",
    featured: true,
    order: 1,
  },
  {
    id: "imigrasi-portal-resmi",
    title: "Situs Resmi Ditjen Imigrasi",
    organization: "Kementerian Hukum dan HAM",
    category: "imigrasi",
    description:
      "Syarat pengajuan paspor, aturan visa, cek status permohonan, dan daftar kantor imigrasi di seluruh Indonesia.",
    url: "https://www.imigrasi.go.id/",
    badge: "Portal Imigrasi",
    featured: true,
    order: 2,
  },
  {
    id: "imigrasi-evisa",
    title: "Layanan eVisa & Izin Tinggal",
    organization: "Ditjen Imigrasi",
    category: "imigrasi",
    description:
      "Pengajuan dan verifikasi visa elektronik (eVisa), izin tinggal terbatas, dan izin masuk kembali.",
    url: "https://evisa.imigrasi.go.id/",
    badge: "Visa Elektronik",
    featured: false,
    order: 3,
  },

  // ==========================================
  // KETENAGAKERJAAN / DEPNAKER & BP2MI
  // ==========================================
  {
    id: "depnaker-siapkerja",
    title: "Portal SIAPkerja",
    organization: "Kementerian Ketenagakerjaan",
    category: "depnaker",
    description:
      "Layanan ketenagakerjaan terpadu untuk pencarian lowongan, pelatihan vokasi, sertifikasi, dan program Karirhub.",
    url: "https://siapkerja.kemnaker.go.id/",
    badge: "SIAPkerja",
    featured: true,
    order: 4,
  },
  {
    id: "depnaker-bp2mi",
    title: "Badan Pelindungan Pekerja Migran (BP2MI)",
    organization: "BP2MI",
    category: "depnaker",
    description:
      "Panduan prosedur kerja luar negeri, program penempatan G-to-G dan P-to-P, serta layanan perlindungan pekerja migran.",
    url: "https://bp2mi.go.id/",
    badge: "Pekerja Migran",
    featured: true,
    order: 5,
  },
  {
    id: "depnaker-siskop2mi",
    title: "Sistem Pendataan SISKOP2MI",
    organization: "BP2MI",
    category: "depnaker",
    description:
      "Pendataan calon pekerja migran, verifikasi dokumen penempatan, dan status proses keberangkatan luar negeri.",
    url: "https://siskop2mi.bp2mi.go.id/",
    badge: "Sistem Verifikasi",
    featured: false,
    order: 6,
  },
  {
    id: "depnaker-kemnaker-portal",
    title: "Situs Resmi Kemnaker",
    organization: "Kementerian Ketenagakerjaan",
    category: "depnaker",
    description:
      "Peraturan ketenagakerjaan, standar kompetensi kerja nasional, dan daftar perusahaan penempatan (P3MI) terdaftar.",
    url: "https://kemnaker.go.id/",
    badge: "Regulasi Kerja",
    featured: false,
    order: 7,
  },

  // ==========================================
  // UJIAN & SERTIFIKASI BAHASA
  // ==========================================
  {
    id: "sertifikasi-hsk",
    title: "Pusat Ujian HSK & HSKK (Mandarin)",
    organization: "Chinese Testing International",
    category: "sertifikasi",
    description:
      "Pendaftaran dan jadwal ujian kemahiran bahasa Mandarin standar internasional untuk level 1 sampai 6.",
    url: "https://www.chinesetest.cn/",
    badge: "Ujian HSK",
    featured: true,
    order: 8,
  },
  {
    id: "sertifikasi-tocfl",
    title: "Pusat Ujian TOCFL (Mandarin Taiwan)",
    organization: "SC-TOP Taiwan",
    category: "sertifikasi",
    description:
      "Standarisasi tes bahasa Mandarin bagi calon pekerja dan mahasiswa yang akan berangkat ke Taiwan.",
    url: "https://tocfl.edu.tw/",
    badge: "TOCFL Taiwan",
    featured: false,
    order: 9,
  },
  {
    id: "sertifikasi-jlpt",
    title: "Ujian Kemampuan Bahasa Jepang (JLPT)",
    organization: "Japan Foundation & JEES",
    category: "sertifikasi",
    description:
      "Jadwal dan ketentuan ujian kemampuan bahasa Jepang (N5 sampai N1) untuk syarat visa kerja SSW dan magang.",
    url: "https://www.jlpt.jp/",
    badge: "JLPT Jepang",
    featured: false,
    order: 10,
  },
]

type FirestoreValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
}

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
}

type FirestoreListResponse = {
  documents?: FirestoreDocument[]
}

const RESOURCES_COLLECTION = "official_resources"

function getDocumentId(path: string) {
  return path.split("/").pop() ?? path
}

function getString(fields: Record<string, FirestoreValue>, key: string, fallback = "") {
  return fields[key]?.stringValue ?? fallback
}

function getNumber(fields: Record<string, FirestoreValue>, key: string, fallback = 0) {
  const value = fields[key]
  if (typeof value?.doubleValue === "number") return value.doubleValue
  if (typeof value?.integerValue === "string") {
    const parsed = Number(value.integerValue)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function getBoolean(fields: Record<string, FirestoreValue>, key: string, fallback = false) {
  return fields[key]?.booleanValue ?? fallback
}

function mapDocumentToResource(doc: FirestoreDocument): InformationResource {
  const fields = doc.fields ?? {}
  const rawCat = getString(fields, "category", "lainnya")
  const validCategory =
    rawCat === "imigrasi" || rawCat === "depnaker" || rawCat === "sertifikasi" ? rawCat : "lainnya"

  return {
    id: getString(fields, "id", getDocumentId(doc.name)),
    title: getString(fields, "title"),
    organization: getString(fields, "organization"),
    category: validCategory,
    description: getString(fields, "description"),
    url: getString(fields, "url"),
    badge: getString(fields, "badge", "Info Resmi"),
    featured: getBoolean(fields, "featured", false),
    order: getNumber(fields, "order", 99),
  }
}

export async function getInformationResources(category: InformationCategory = "all"): Promise<InformationResource[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  let resources: InformationResource[] = [...DEFAULT_INFORMATION_RESOURCES]

  if (projectId && apiKey) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${RESOURCES_COLLECTION}?key=${apiKey}`
      const response = await fetch(url, {
        next: { revalidate: 300 }, // cache 5 menit
      })

      if (response.ok) {
        const data = (await response.json()) as FirestoreListResponse
        if (data.documents && data.documents.length > 0) {
          const dynamicResources = data.documents.map(mapDocumentToResource)
          // Merge dynamic items with default items, avoiding duplicate IDs
          const dynamicMap = new Map(dynamicResources.map((item) => [item.id, item]))
          resources = [
            ...dynamicResources,
            ...DEFAULT_INFORMATION_RESOURCES.filter((item) => !dynamicMap.has(item.id)),
          ]
        }
      }
    } catch {
      // Fallback ke default resources jika network/firestore ada kendala
      resources = [...DEFAULT_INFORMATION_RESOURCES]
    }
  }

  // Sort by order ascending
  resources.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  if (category === "all") {
    return resources
  }

  return resources.filter((item) => item.category === category)
}
