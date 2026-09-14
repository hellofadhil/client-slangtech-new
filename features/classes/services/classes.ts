export type LocalizedText = {
  id: string
  en: string
  zh: string
}

export type ClassType = "private" | "group"

export type ClassImage = {
  url: string
  alt: string
}

export type Class = {
  id: string
  slug: string
  name: LocalizedText
  type: ClassType
  level: string
  price: number
  discountPrice?: number | null
  longDescription: LocalizedText
  totalSessions: number
  sessionDurationMinutes: number
  coverImage: string
  images: ClassImage[]
  isActive: boolean
  isFeatured: boolean
  createdAt: Date | unknown
  updatedAt: Date | unknown
}

export type ClassInput = Omit<Class, "id" | "createdAt" | "updatedAt">

export interface ClassQuery {
  type?: ClassType | "all"
  status?: "active" | "inactive" | "all"
  search?: string
}

type FirestoreValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
  arrayValue?: {
    values?: FirestoreValue[]
  }
  mapValue?: {
    fields?: Record<string, FirestoreValue>
  }
}

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
  createTime?: string
  updateTime?: string
}

type FirestoreListResponse = {
  documents?: FirestoreDocument[]
}

const CLASSES_COLLECTION = "classes"

function getDocumentId(path: string) {
  return path.split("/").pop() ?? path
}

function getString(fields: Record<string, FirestoreValue>, key: string, fallback = "") {
  return fields[key]?.stringValue ?? fallback
}

function getNumber(fields: Record<string, FirestoreValue>, key: string, fallback = 0) {
  const value = fields[key]

  if (typeof value?.doubleValue === "number") {
    return value.doubleValue
  }

  if (typeof value?.integerValue === "string") {
    const parsed = Number(value.integerValue)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function getNullableNumber(fields: Record<string, FirestoreValue>, key: string) {
  const value = fields[key]

  if (!value || "nullValue" in value) {
    return null
  }

  return getNumber(fields, key, 0)
}

function getBoolean(fields: Record<string, FirestoreValue>, key: string, fallback = false) {
  return fields[key]?.booleanValue ?? fallback
}

function getDate(fields: Record<string, FirestoreValue>, key: string, fallback?: string) {
  const rawValue = fields[key]?.timestampValue ?? fallback

  if (!rawValue) {
    return null
  }

  const date = new Date(rawValue)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function getLocalizedText(fields: Record<string, FirestoreValue>, key: string): LocalizedText {
  const localizedFields = fields[key]?.mapValue?.fields ?? {}

  return {
    id: localizedFields.id?.stringValue ?? "",
    en: localizedFields.en?.stringValue ?? "",
    zh: localizedFields.zh?.stringValue ?? "",
  }
}

function getImages(fields: Record<string, FirestoreValue>) {
  const values = fields.images?.arrayValue?.values ?? []

  return values
    .map((value): ClassImage | null => {
      const imageFields = value.mapValue?.fields

      if (!imageFields) {
        return null
      }

      const url = imageFields.url?.stringValue ?? ""
      const alt = imageFields.alt?.stringValue ?? ""

      if (!url) {
        return null
      }

      return { url, alt }
    })
    .filter((image): image is ClassImage => image !== null)
}

function isClassType(value: string): value is ClassType {
  return value === "private" || value === "group"
}

function mapFirestoreDocument(document: FirestoreDocument): Class {
  const fields = document.fields ?? {}
  const type = getString(fields, "type", "private")

  return {
    id: getDocumentId(document.name),
    slug: getString(fields, "slug"),
    name: getLocalizedText(fields, "name"),
    type: isClassType(type) ? type : "private",
    level: getString(fields, "level"),
    price: getNumber(fields, "price"),
    discountPrice: getNullableNumber(fields, "discountPrice"),
    longDescription: getLocalizedText(fields, "longDescription"),
    totalSessions: getNumber(fields, "totalSessions"),
    sessionDurationMinutes: getNumber(fields, "sessionDurationMinutes"),
    coverImage: getString(fields, "coverImage"),
    images: getImages(fields),
    isActive: getBoolean(fields, "isActive"),
    isFeatured: getBoolean(fields, "isFeatured"),
    createdAt: getDate(fields, "createdAt", document.createTime),
    updatedAt: getDate(fields, "updatedAt", document.updateTime),
  }
}

function matchesQuery(classItem: Class, query: ClassQuery) {
  if (query.status === "active" && !classItem.isActive) {
    return false
  }

  if (query.status === "inactive" && classItem.isActive) {
    return false
  }

  if (query.type && query.type !== "all" && classItem.type !== query.type) {
    return false
  }

  if (query.search) {
    const searchTerm = query.search.toLowerCase()
    const searchableText = [
      classItem.slug,
      classItem.level,
      classItem.name.id,
      classItem.name.en,
      classItem.name.zh,
      classItem.longDescription.id,
      classItem.longDescription.en,
      classItem.longDescription.zh,
    ]
      .join(" ")
      .toLowerCase()

    return searchableText.includes(searchTerm)
  }

  return true
}

function getComparableDate(value: unknown) {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "string") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
  }

  return 0
}

export async function getClasses(query: ClassQuery = { status: "active" }) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!projectId || !apiKey) {
    console.warn("Firebase project configuration is missing.")
    return []
  }

  const params = new URLSearchParams({
    key: apiKey,
    pageSize: "100",
  })

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${CLASSES_COLLECTION}?${params.toString()}`

  try {
    const response = await fetch(url, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Failed to fetch classes from Firestore: ${response.status}`)
      return []
    }

    const data = (await response.json()) as FirestoreListResponse
    const classes = data.documents?.map(mapFirestoreDocument) ?? []

    return classes
      .filter((classItem) => matchesQuery(classItem, query))
      .sort((firstClass, secondClass) => {
        if (firstClass.isFeatured !== secondClass.isFeatured) {
          return firstClass.isFeatured ? -1 : 1
        }

        return getComparableDate(secondClass.createdAt) - getComparableDate(firstClass.createdAt)
      })
  } catch (error) {
    console.error("Unable to fetch classes from Firestore.", error)
    return []
  }
}

export async function getClassBySlugOrId(slugOrId: string) {
  const normalizedSlugOrId = (() => {
    try {
      return decodeURIComponent(slugOrId)
    } catch {
      return slugOrId
    }
  })()
  const classes = await getClasses({ status: "active" })

  return (
    classes.find(
      (classItem) => classItem.slug === normalizedSlugOrId || classItem.id === normalizedSlugOrId,
    ) ?? null
  )
}
