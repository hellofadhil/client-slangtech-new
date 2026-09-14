import type { ClassImage, LocalizedText } from "@/features/classes/services/classes"

export type EventPriceType = "free" | "paid"

export type EventImage = ClassImage

export type EventTrainer = {
  id: string
  name: string
}

export type EventContact = {
  name: string
  whatsappNumber: string
}

export type EventSession = {
  id: string
  sessionNumber: number
  title: string
  startsAt: string
  timezone: string
  notes: string
}

export type Event = {
  id: string
  slug: string
  name: LocalizedText
  longDescription: LocalizedText
  priceType: EventPriceType
  price: number
  sessions: EventSession[]
  startsAt: string
  timezone: string
  trainers: EventTrainer[]
  contact: EventContact
  coverImage: string
  images: EventImage[]
  isActive: boolean
  isFeatured: boolean
  createdAt: Date | unknown
  updatedAt: Date | unknown
}

export interface EventQuery {
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

type FirestoreRunQueryRow = {
  document?: FirestoreDocument
}

const EVENTS_COLLECTION = "events"

function getFirebaseConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!projectId || !apiKey) {
    return null
  }

  return { projectId, apiKey }
}

function getEventsCollectionUrl(pageSize = "100") {
  const config = getFirebaseConfig()

  if (!config) {
    return null
  }

  const params = new URLSearchParams({
    key: config.apiKey,
    pageSize,
  })

  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${EVENTS_COLLECTION}?${params.toString()}`
}

function getEventDocumentUrl(eventId: string) {
  const config = getFirebaseConfig()

  if (!config) {
    return null
  }

  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${EVENTS_COLLECTION}/${encodeURIComponent(
    eventId,
  )}?key=${config.apiKey}`
}

function getEventsRunQueryUrl() {
  const config = getFirebaseConfig()

  if (!config) {
    return null
  }

  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery?key=${config.apiKey}`
}

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
    .map((value): EventImage | null => {
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
    .filter((image): image is EventImage => image !== null)
}

function getContact(fields: Record<string, FirestoreValue>): EventContact {
  const contactFields = fields.contact?.mapValue?.fields ?? {}

  return {
    name: contactFields.name?.stringValue ?? "",
    whatsappNumber: contactFields.whatsappNumber?.stringValue ?? "",
  }
}

function getSessions(fields: Record<string, FirestoreValue>) {
  const values = fields.sessions?.arrayValue?.values ?? []

  return values
    .map((value): EventSession | null => {
      const sessionFields = value.mapValue?.fields

      if (!sessionFields) {
        return null
      }

      return {
        id: getString(sessionFields, "id"),
        sessionNumber: getNumber(sessionFields, "sessionNumber"),
        title: getString(sessionFields, "title"),
        startsAt: getString(sessionFields, "startsAt"),
        timezone: getString(sessionFields, "timezone", "Asia/Jakarta"),
        notes: getString(sessionFields, "notes"),
      }
    })
    .filter((session): session is EventSession => session !== null)
    .sort((firstSession, secondSession) => firstSession.sessionNumber - secondSession.sessionNumber)
}

function getTrainers(fields: Record<string, FirestoreValue>) {
  const values = fields.trainers?.arrayValue?.values ?? []

  return values
    .map((value): EventTrainer | null => {
      const trainerFields = value.mapValue?.fields

      if (!trainerFields) {
        return null
      }

      const id = getString(trainerFields, "id")
      const name = getString(trainerFields, "name")

      if (!id && !name) {
        return null
      }

      return { id, name }
    })
    .filter((trainer): trainer is EventTrainer => trainer !== null)
}

function isEventPriceType(value: string): value is EventPriceType {
  return value === "free" || value === "paid"
}

function mapFirestoreDocument(document: FirestoreDocument): Event {
  const fields = document.fields ?? {}
  const priceType = getString(fields, "priceType", "free")

  return {
    id: getDocumentId(document.name),
    slug: getString(fields, "slug"),
    name: getLocalizedText(fields, "name"),
    longDescription: getLocalizedText(fields, "longDescription"),
    priceType: isEventPriceType(priceType) ? priceType : "free",
    price: getNumber(fields, "price"),
    sessions: getSessions(fields),
    startsAt: getString(fields, "startsAt"),
    timezone: getString(fields, "timezone", "Asia/Jakarta"),
    trainers: getTrainers(fields),
    contact: getContact(fields),
    coverImage: getString(fields, "coverImage"),
    images: getImages(fields),
    isActive: getBoolean(fields, "isActive"),
    isFeatured: getBoolean(fields, "isFeatured"),
    createdAt: getDate(fields, "createdAt", document.createTime),
    updatedAt: getDate(fields, "updatedAt", document.updateTime),
  }
}

function matchesQuery(event: Event, query: EventQuery) {
  if (query.status === "active" && !event.isActive) {
    return false
  }

  if (query.status === "inactive" && event.isActive) {
    return false
  }

  if (query.search) {
    const searchTerm = query.search.toLowerCase()
    const searchableText = [
      event.slug,
      event.name.id,
      event.name.en,
      event.name.zh,
      event.longDescription.id,
      event.longDescription.en,
      event.longDescription.zh,
      event.trainers.map((trainer) => trainer.name).join(" "),
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

export async function getEvents(query: EventQuery = { status: "active" }) {
  const url = getEventsCollectionUrl("100")

  if (!url) {
    console.warn("Firebase project configuration is missing.")
    return []
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Failed to fetch events from Firestore: ${response.status}`)
      return []
    }

    const data = (await response.json()) as FirestoreListResponse
    const events = data.documents?.map(mapFirestoreDocument) ?? []

    return events
      .filter((event) => matchesQuery(event, query))
      .sort((firstEvent, secondEvent) => {
        if (firstEvent.isFeatured !== secondEvent.isFeatured) {
          return firstEvent.isFeatured ? -1 : 1
        }

        const firstStartsAt = getComparableDate(firstEvent.startsAt) || Number.MAX_SAFE_INTEGER
        const secondStartsAt = getComparableDate(secondEvent.startsAt) || Number.MAX_SAFE_INTEGER

        return firstStartsAt - secondStartsAt
      })
  } catch (error) {
    console.error("Unable to fetch events from Firestore.", error)
    return []
  }
}

export async function getEventBySlugOrId(slugOrId: string) {
  const normalizedSlugOrId = (() => {
    try {
      return decodeURIComponent(slugOrId)
    } catch {
      return slugOrId
    }
  })()
  const documentUrl = getEventDocumentUrl(normalizedSlugOrId)
  const runQueryUrl = getEventsRunQueryUrl()

  if (!documentUrl || !runQueryUrl) {
    console.warn("Firebase project configuration is missing.")
    return null
  }

  try {
    const documentResponse = await fetch(documentUrl, {
      cache: "no-store",
    })

    if (documentResponse.ok) {
      const document = (await documentResponse.json()) as FirestoreDocument
      const event = mapFirestoreDocument(document)

      return event.isActive ? event : null
    }

    const slugResponse = await fetch(runQueryUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [
            {
              collectionId: EVENTS_COLLECTION,
            },
          ],
          where: {
            fieldFilter: {
              field: {
                fieldPath: "slug",
              },
              op: "EQUAL",
              value: {
                stringValue: normalizedSlugOrId,
              },
            },
          },
          limit: 1,
        },
      }),
    })

    if (!slugResponse.ok) {
      console.error(`Failed to fetch event detail from Firestore: ${slugResponse.status}`)
      return null
    }

    const rows = (await slugResponse.json()) as FirestoreRunQueryRow[]
    const document = rows.find((row) => row.document)?.document

    if (!document) {
      return null
    }

    const event = mapFirestoreDocument(document)
    return event.isActive ? event : null
  } catch (error) {
    console.error("Unable to fetch event detail from Firestore.", error)
    return null
  }
}
