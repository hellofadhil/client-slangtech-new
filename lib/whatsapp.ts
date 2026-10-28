const DEFAULT_WA_BASE_URL = "https://api-wa.baselab.web.id"
const DEFAULT_WA_BOT_NAME = "production"
const DEFAULT_WA_ADMIN_PHONE = "6289514563365"

export interface WhatsAppConfig {
  baseUrl: string
  userBot: string
  apiKey: string
  adminPhone: string
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lkp-slangtech"
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const firestoreSettings: Partial<WhatsAppConfig> = {}

  if (firebaseApiKey) {
    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whatsappSettings/primary?key=${firebaseApiKey}`,
        { cache: "no-store" }
      )
      if (res.ok) {
        const data = await res.json()
        const fields = data?.fields || {}
        if (fields.baseUrl?.stringValue) firestoreSettings.baseUrl = fields.baseUrl.stringValue
        if (fields.userBot?.stringValue) firestoreSettings.userBot = fields.userBot.stringValue
        if (fields.apiKey?.stringValue) firestoreSettings.apiKey = fields.apiKey.stringValue
        if (fields.adminPhone?.stringValue) firestoreSettings.adminPhone = fields.adminPhone.stringValue
      }
    } catch {
      // Fallback silently to environment variables
    }
  }

  const baseUrl = (
    firestoreSettings.baseUrl ||
    process.env.WA_API_BASE_URL ||
    DEFAULT_WA_BASE_URL
  ).replace(/\/+$/, "")

  const userBot = firestoreSettings.userBot || process.env.WA_BOT_NAME || DEFAULT_WA_BOT_NAME
  const apiKey = firestoreSettings.apiKey || process.env.WA_API_KEY || ""
  const adminPhone =
    firestoreSettings.adminPhone || process.env.WA_ADMIN_PHONE || DEFAULT_WA_ADMIN_PHONE

  return {
    baseUrl,
    userBot,
    apiKey,
    adminPhone,
  }
}
