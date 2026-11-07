export type InformationCategory = "all" | "imigrasi" | "depnaker" | "sertifikasi" | "lainnya"

export type InformationResource = {
  id: string
  title: string
  organization: string
  category: "imigrasi" | "depnaker" | "sertifikasi" | "lainnya"
  description: string
  url: string
  badge: string
  featured?: boolean
  order?: number
}
