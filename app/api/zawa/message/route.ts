import { NextResponse } from "next/server"

export const runtime = "nodejs"

const ZAWA_MESSAGE_URL = "https://manage.slangtech.asia/api/zawa/message"
const ZAWA_MESSAGE_TIMEOUT_MS = 8000

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
  }>
}

type ZawaMessageRequest = {
  idToken?: string
  uid?: string
  phone?: string
  type?: "text"
  text?: string
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

function getRequiredZawaApiKey() {
  const apiKey = process.env.ZAWA_MESSAGE_API_KEY

  if (!apiKey) {
    throw new Error("Konfigurasi Zawa message API belum lengkap.")
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
  return value.replace(/[^\d]/g, "").replace(/^0+/, "")
}

async function readZawaError(response: Response) {
  const text = await response.text().catch(() => "")

  if (text) {
    return text
  }

  return "Pesan Zawa belum berhasil dikirim."
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as ZawaMessageRequest | null

    if (!body?.idToken || !body.uid || !body.phone || !body.text || body.type !== "text") {
      return jsonError("Data pesan Zawa belum lengkap.", 400)
    }

    const isValidUser = await verifyFirebaseUser(body.idToken, body.uid)

    if (!isValidUser) {
      return jsonError("Sesi login tidak valid untuk mengirim pesan Zawa.", 401)
    }

    const phone = normalizePhoneNumber(body.phone)

    if (!phone) {
      return jsonError("Nomor telepon tujuan belum valid.", 400)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ZAWA_MESSAGE_TIMEOUT_MS)

    const response = await fetch(ZAWA_MESSAGE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getRequiredZawaApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        type: "text",
        text: body.text,
      }),
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      return jsonError(await readZawaError(response), response.status)
    }

    const data = await response.json().catch(() => ({ ok: true }))

    return NextResponse.json(data)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Pesan Zawa belum berhasil dikirim.",
      500,
    )
  }
}
