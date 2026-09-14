import { NextResponse } from "next/server"

export const runtime = "nodejs"

const DEFAULT_ADMIN_EMAIL = "slangtech.indo@gmail.com"

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
  }>
}

type EventRegistrationEmailRequest = {
  idToken?: string
  uid?: string
  email?: string
  fullName?: string
  eventName?: string
  enrollmentId?: string
  eventDate?: string
  eventPrice?: string
  dashboardUrl?: string
}

type EventRegistrationEmailContent = Required<
  Pick<
    EventRegistrationEmailRequest,
    "email" | "fullName" | "eventName" | "eventDate" | "eventPrice" | "dashboardUrl"
  >
>

type EventRegistrationAdminEmailContent = EventRegistrationEmailContent & {
  enrollmentId: string
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim()
}

function normalizeRecipients(recipients: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      recipients
        .filter((recipient): recipient is string => Boolean(recipient))
        .map((recipient) => sanitizeHeader(recipient))
        .filter(Boolean),
    ),
  )
}

function getRegistrationAdminEmail() {
  return sanitizeHeader(process.env.REGISTRATION_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
}

function getRequiredSmtpConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || "465")
  const secure = (process.env.SMTP_SECURE ?? "true") === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || (user ? `LKP SlangTech <${user}>` : "")

  if (!host || !Number.isFinite(port) || port <= 0 || !user || !pass || !from) {
    throw new Error("Konfigurasi SMTP belum lengkap.")
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    from,
  }
}

async function verifyFirebaseUser(idToken: string, expectedUserId: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!apiKey) {
    throw new Error("Konfigurasi Firebase belum lengkap.")
  }

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function createEventRegistrationEmail(input: EventRegistrationEmailContent) {
  const safeFullName = escapeHtml(input.fullName)
  const safeEventName = escapeHtml(input.eventName)
  const safeEventDate = escapeHtml(input.eventDate)
  const safeEventPrice = escapeHtml(input.eventPrice)
  const safeDashboardUrl = escapeHtml(input.dashboardUrl)

  return {
    subject: `Pendaftaran Event ${input.eventName} Berhasil`,
    text: [
      `Halo ${input.fullName},`,
      "",
      `Pendaftaran kamu untuk event ${input.eventName} sudah berhasil kami terima.`,
      `Jadwal: ${input.eventDate}`,
      `Biaya: ${input.eventPrice}`,
      "",
      `Kamu bisa memantau detail event dan absensi melalui dashboard: ${input.dashboardUrl}`,
      "",
      "Terima kasih,",
      "LKP SlangTech",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h1 style="margin:0 0 12px;color:#087A35;font-size:24px">
          Pendaftaran Event Berhasil
        </h1>

        <p>Halo <strong>${safeFullName}</strong>,</p>

        <p>
          Pendaftaran kamu untuk event <strong>${safeEventName}</strong> sudah berhasil kami terima.
        </p>

        <div style="margin:20px 0;padding:16px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB">
          <p style="margin:0 0 8px">
            <strong>Jadwal:</strong> ${safeEventDate}
          </p>
          <p style="margin:0">
            <strong>Biaya:</strong> ${safeEventPrice}
          </p>
        </div>

        <p>
          Kamu bisa memantau detail event dan absensi melalui dashboard.
        </p>

        <p>
          <a
            href="${safeDashboardUrl}"
            style="display:inline-block;background:#087A35;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700"
          >
            Buka Dashboard
          </a>
        </p>

        <p style="margin-top:24px;color:#6B7280">
          Terima kasih,<br />
          LKP SlangTech
        </p>
      </div>
    `,
  }
}

function createEventRegistrationAdminEmail(input: EventRegistrationAdminEmailContent) {
  const safeFullName = escapeHtml(input.fullName)
  const safeEmail = escapeHtml(input.email)
  const safeEventName = escapeHtml(input.eventName)
  const safeEventDate = escapeHtml(input.eventDate)
  const safeEventPrice = escapeHtml(input.eventPrice)
  const safeEnrollmentId = escapeHtml(input.enrollmentId || "-")

  return {
    subject: `Pendaftaran event baru: ${input.eventName}`,
    text: [
      "Ada pendaftaran event baru di SlangTech.",
      "",
      `Nama: ${input.fullName}`,
      `Email: ${input.email}`,
      `Event: ${input.eventName}`,
      `Jadwal: ${input.eventDate}`,
      `Biaya: ${input.eventPrice}`,
      `Enrollment ID: ${input.enrollmentId || "-"}`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h1 style="margin:0 0 12px;color:#087A35;font-size:24px">
          Pendaftaran Event Baru
        </h1>

        <p>Ada pendaftaran event baru di SlangTech.</p>

        <div style="margin:20px 0;padding:16px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB">
          <p style="margin:0 0 8px"><strong>Nama:</strong> ${safeFullName}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin:0 0 8px"><strong>Event:</strong> ${safeEventName}</p>
          <p style="margin:0 0 8px"><strong>Jadwal:</strong> ${safeEventDate}</p>
          <p style="margin:0 0 8px"><strong>Biaya:</strong> ${safeEventPrice}</p>
          <p style="margin:0"><strong>Enrollment ID:</strong> ${safeEnrollmentId}</p>
        </div>
      </div>
    `,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as EventRegistrationEmailRequest | null

    if (!body?.idToken || !body.uid || !body.email || !body.fullName || !body.eventName) {
      return jsonError("Data email pendaftaran event belum lengkap.", 400)
    }

    const isValidUser = await verifyFirebaseUser(body.idToken, body.uid)

    if (!isValidUser) {
      return jsonError("Sesi login tidak valid untuk mengirim email.", 401)
    }

    const smtpConfig = getRequiredSmtpConfig()

    const nodemailer = await import("nodemailer")

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    const studentEmail = createEventRegistrationEmail({
      email: body.email,
      fullName: body.fullName,
      eventName: body.eventName,
      eventDate: body.eventDate || "Jadwal segera diumumkan",
      eventPrice: body.eventPrice || "-",
      dashboardUrl: body.dashboardUrl || `${appUrl}/home`,
    })
    const adminEmail = createEventRegistrationAdminEmail({
      email: body.email,
      fullName: body.fullName,
      eventName: body.eventName,
      enrollmentId: body.enrollmentId || "-",
      eventDate: body.eventDate || "Jadwal segera diumumkan",
      eventPrice: body.eventPrice || "-",
      dashboardUrl: body.dashboardUrl || `${appUrl}/home`,
    })

    const studentRecipients = normalizeRecipients([body.email])
    const adminRecipients = normalizeRecipients([getRegistrationAdminEmail()])

    await transporter.sendMail({
      from: smtpConfig.from,
      to: studentRecipients,
      subject: studentEmail.subject,
      text: studentEmail.text,
      html: studentEmail.html,
    })

    await transporter.sendMail({
      from: smtpConfig.from,
      to: adminRecipients,
      replyTo: sanitizeHeader(body.email),
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
    })

    return NextResponse.json({
      ok: true,
      recipients: {
        student: studentRecipients,
        admin: adminRecipients,
      },
    })
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Email pendaftaran event belum berhasil dikirim.",
      500,
    )
  }
}
