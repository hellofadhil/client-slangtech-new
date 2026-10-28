import { NextResponse } from "next/server"
import { getWhatsAppConfig } from "@/lib/whatsapp"

export const runtime = "nodejs"

const DASHBOARD_WA_URL = "https://manage.slangtech.asia/api/whatsapp/message"
const WA_MESSAGE_TIMEOUT_MS = 10000

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
  }>
}

type WhatsAppMessageRequest = {
  idToken?: string
  uid?: string
  phone?: string
  type?: "text"
  text?: string
  message?: string
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function getRequiredFirebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!apiKey) {
    throw new Error("Konfigurasi Firebase belum lengkap.")
  }

  return apiKey
}

async function verifyFirebaseUser(idToken: string, expectedUserId: string) {
  const apiKey = getRequiredFirebaseApiKey()
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    },
  )

  if (!response.ok) {
    return false
  }

  const data = (await response.json().catch(() => null)) as FirebaseLookupResponse | null
  const uid = data?.users?.[0]?.localId

  return Boolean(uid && uid === expectedUserId)
}

function normalizePhoneNumber(value: string) {
  let cleaned = value.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.slice(1)}`
  } else if (cleaned.startsWith("8")) {
    cleaned = `62${cleaned}`
  }
  return cleaned
}

async function readResponseError(response: Response) {
  const text = await response.text().catch(() => "")
  if (text) {
    return text
  }
  return "Pesan WhatsApp belum berhasil dikirim."
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as WhatsAppMessageRequest | null
    const messageContent = body?.message || body?.text

    if (!body?.idToken || !body.uid || !body.phone || !messageContent) {
      return jsonError("Data pesan WhatsApp belum lengkap.", 400)
    }

    const isValidUser = await verifyFirebaseUser(body.idToken, body.uid)

    if (!isValidUser) {
      return jsonError("Sesi login tidak valid untuk mengirim pesan WhatsApp.", 401)
    }

    const phone = normalizePhoneNumber(body.phone)

    if (!phone || phone.length < 9) {
      return jsonError("Nomor telepon tujuan belum valid.", 400)
    }

    const waConfig = await getWhatsAppConfig()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WA_MESSAGE_TIMEOUT_MS)

    let response: Response

    if (waConfig.apiKey) {
      // Send directly via Baselab WA Gateway
      response = await fetch(`${waConfig.baseUrl}/api/send-message`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${waConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userBot: waConfig.userBot,
          phone,
          message: messageContent,
        }),
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    } else {
      // Fallback via Dashboard WhatsApp Message endpoint
      const dashboardKey = process.env.ZAWA_MESSAGE_API_KEY?.trim() || ""
      const dashboardUrl = process.env.DASHBOARD_WA_URL || DASHBOARD_WA_URL

      response = await fetch(dashboardUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${dashboardKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          message: messageContent,
        }),
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    }

    if (!response.ok) {
      return jsonError(await readResponseError(response), response.status)
    }

    const data = await response.json().catch(() => ({ ok: true }))
    return NextResponse.json(data)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Pesan WhatsApp belum berhasil dikirim.",
      500,
    )
  }
}
