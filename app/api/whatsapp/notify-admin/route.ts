import { NextResponse } from "next/server"
import { getWhatsAppConfig } from "@/lib/whatsapp"

export const runtime = "nodejs"

const DASHBOARD_WA_URL = "https://manage.slangtech.asia/api/whatsapp/message"
const WA_TIMEOUT_MS = 10000

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
  }>
}

type NotifyAdminRequest = {
  idToken?: string
  uid?: string
  registrationType?: "class" | "event"
  itemName?: string
  itemPrice?: string
  enrollmentId?: string
  studentName?: string
  studentEmail?: string
  studentPhone?: string
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
  let cleaned = (value || "").replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.slice(1)}`
  } else if (cleaned.startsWith("8")) {
    cleaned = `62${cleaned}`
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as NotifyAdminRequest | null

    if (!body?.idToken || !body?.uid || !body?.itemName) {
      return jsonError("Data pendaftaran belum lengkap.", 400)
    }

    const isValidUser = await verifyFirebaseUser(body.idToken, body.uid)
    if (!isValidUser) {
      return jsonError("Sesi login tidak valid.", 401)
    }

    const waConfig = await getWhatsAppConfig()
    const adminPhone = normalizePhoneNumber(waConfig.adminPhone)
    const typeLabel = body.registrationType === "event" ? "Event" : "Kelas"
    const studentName = body.studentName || "Siswa Baru"
    const studentEmail = body.studentEmail || "-"
    const studentPhone = body.studentPhone || "-"
    const itemName = body.itemName
    const itemPrice = body.itemPrice || "-"

    const message = [
      `Pendaftaran ${typeLabel} Baru Masuk`,
      "",
      `Program: ${itemName}`,
      `Biaya: ${itemPrice}`,
      "",
      `Nama Siswa: ${studentName}`,
      `Email: ${studentEmail}`,
      `No. WhatsApp: ${studentPhone}`,
      "",
      "Bukti pembayaran telah diunggah. Silakan verifikasi di dashboard admin.",
    ].join("\n")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WA_TIMEOUT_MS)

    let response: Response

    if (waConfig.apiKey) {
      response = await fetch(`${waConfig.baseUrl}/api/send-message`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${waConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userBot: waConfig.userBot,
          phone: adminPhone,
          message,
        }),
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    } else {
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
          phone: adminPhone,
          message,
        }),
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      return jsonError(errText || "Notifikasi admin WhatsApp belum berhasil dikirim.", response.status)
    }

    const data = await response.json().catch(() => ({ ok: true }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim notifikasi admin.",
      500,
    )
  }
}
