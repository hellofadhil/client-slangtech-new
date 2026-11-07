import type { InformationResource, InformationCategory } from "../types"

export const DEFAULT_INFORMATION_RESOURCES: InformationResource[] = [
  // ==========================================
  // IMIGRASI & PASPOR
  // ==========================================
  {
    id: "imigrasi-m-paspor",
    title: "Aplikasi M-Paspor (Antrean Paspor Online)",
    organization: "Direktorat Jenderal Imigrasi RI",
    category: "imigrasi",
    description:
      "Aplikasi resmi pendaftaran permohonan dan antrean pembuatan/penggantian paspor RI secara online sebelum datang ke kantor imigrasi.",
    url: "https://antrian.imigrasi.go.id/",
    badge: "Layanan Paspor",
    featured: true,
    order: 1,
  },
  {
    id: "imigrasi-portal-resmi",
    title: "Portal Resmi Ditjen Imigrasi Kemenkumham",
    organization: "Kementerian Hukum dan HAM RI",
    category: "imigrasi",
    description:
      "Pusat informasi resmi persyaratan paspor, regulasi visa, cek status permohonan, dan lokasi seluruh kantor imigrasi se-Indonesia.",
    url: "https://www.imigrasi.go.id/",
    badge: "Portal Resmi",
    featured: true,
    order: 2,
  },
  {
    id: "imigrasi-evisa",
    title: "Layanan eVisa & Izin Tinggal Indonesia",
    organization: "Ditjen Imigrasi RI",
    category: "imigrasi",
    description:
      "Portal informasi resmi pengajuan dan verifikasi visa elektronik (eVisa), izin tinggal terbatas, dan izin kembali.",
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
    title: "Portal SIAPkerja (Kementerian Ketenagakerjaan)",
    organization: "Kementerian Ketenagakerjaan RI",
    category: "depnaker",
    description:
      "Ekosistem digital ketenagakerjaan resmi Kemnaker RI untuk informasi lowongan, pelatihan vokasi, sertifikasi, dan Karirhub.",
    url: "https://siapkerja.kemnaker.go.id/",
    badge: "Kemnaker RI",
    featured: true,
    order: 4,
  },
  {
    id: "depnaker-bp2mi",
    title: "Portal Resmi BP2MI (Pelindungan Pekerja Migran)",
    organization: "Badan Pelindungan Pekerja Migran Indonesia",
    category: "depnaker",
    description:
      "Informasi resmi prosedur, regulasi, program G-to-G / P-to-P penempatan kerja ke luar negeri, dan perlindungan PMI.",
    url: "https://bp2mi.go.id/",
    badge: "Penempatan LN",
    featured: true,
    order: 5,
  },
  {
    id: "depnaker-siskop2mi",
    title: "SISKOP2MI - Sistem Penempatan & Pelindungan PMI",
    organization: "BP2MI RI",
    category: "depnaker",
    description:
      "Sistem pendataan resmi calon pekerja migran, verifikasi dokumen penempatan, dan status proses keberangkatan luar negeri.",
    url: "https://siskop2mi.bp2mi.go.id/",
    badge: "Sistem Resmi",
    featured: false,
    order: 6,
  },
  {
    id: "depnaker-kemnaker-portal",
    title: "Website Resmi Kemnaker RI",
    organization: "Kementerian Ketenagakerjaan RI",
    category: "depnaker",
    description:
      "Update regulasi ketenagakerjaan, standar kompetensi kerja nasional, dan direktori lembaga penempatan resmi.",
    url: "https://kemnaker.go.id/",
    badge: "Regulasi Ketenagakerjaan",
    featured: false,
    order: 7,
  },

  // ==========================================
  // UJIAN & SERTIFIKASI BAHASA
  // ==========================================
  {
    id: "sertifikasi-hsk",
    title: "Chinese Testing International (Ujian HSK / HSKK)",
    organization: "Center for Language Education and Cooperation (CLEC)",
    category: "sertifikasi",
    description:
      "Pusat resmi pendaftaran dan informasi ujian kemahiran bahasa Mandarin standar internasional (HSK level 1-6 dan HSKK).",
    url: "https://www.chinesetest.cn/",
    badge: "Mandarin HSK",
    featured: true,
    order: 8,
  },
  {
    id: "sertifikasi-tocfl",
    title: "Steering Committee for TOCFL (Taiwan)",
    organization: "National Taiwan Normal University / SC-TOP",
    category: "sertifikasi",
    description:
      "Portal resmi tes standarisasi bahasa Mandarin untuk keperluan studi dan izin kerja di Taiwan (TOCFL).",
    url: "https://tocfl.edu.tw/",
    badge: "Mandarin Taiwan",
    featured: false,
    order: 9,
  },
  {
    id: "sertifikasi-jlpt",
    title: "JLPT Japanese-Language Proficiency Test",
    organization: "Japan Foundation & JEES",
    category: "sertifikasi",
    description:
      "Pusat informasi resmi sertifikasi bahasa Jepang (N5 hingga N1) untuk syarat visa kerja spesifik (SSW/Tokutei Ginou) dan magang di Jepang.",
    url: "https://www.jlpt.jp/",
    badge: "Jepang JLPT",
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
