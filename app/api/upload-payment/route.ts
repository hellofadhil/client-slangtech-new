import { createHash, createHmac, randomUUID } from "crypto"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const MAX_FILE_SIZE = Math.floor(1.5 * 1024 * 1024)
const R2_REGION = "auto"
const R2_SERVICE = "s3"
const TINYPNG_SHRINK_URL = "https://api.tinify.com/shrink"

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
  }>
}

type UploadConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

function jsonError(message: string, status: number) {
  const safeMessage = message.length > 240 ? `${message.slice(0, 240)}...` : message

  return NextResponse.json({ error: safeMessage }, { status })
}

function getUploadConfig(): UploadConfig {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Konfigurasi R2 belum lengkap.")
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  }
}

function getTinyPngApiKeys() {
  return (process.env.TINYPNG_API_KEYS || process.env.TINYPNG_API_KEY || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
}

function getTinyPngAuthorizationHeader(apiKey: string) {
  return `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`
}

function hashHex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex")
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest()
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex")
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, R2_REGION)
  const serviceKey = hmac(regionKey, R2_SERVICE)

  return hmac(serviceKey, "aws4_request")
}

function getAmzDates(date = new Date()) {
  const isoDate = date.toISOString()
  const dateStamp = isoDate.slice(0, 10).replace(/-/g, "")
  const amzDate = `${dateStamp}T${isoDate.slice(11, 19).replace(/:/g, "")}Z`

  return { amzDate, dateStamp }
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodePathSegment).join("/")
}

function sanitizePathPart(value: string, fallback: string) {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized || fallback
}

function createObjectKey(params: {
  fileName: string
  userId: string
  targetId: string
  folder?: string
}) {
  const safeUserId = sanitizePathPart(params.userId, "user")
  const safeTargetId = sanitizePathPart(params.targetId, "enrollment-target")
  const safeFileName = sanitizePathPart(params.fileName, "uploaded-file")
  const safeFolder = sanitizePathPart(params.folder ?? "payment-proofs", "uploads")

  return `${safeFolder}/${safeUserId}/${safeTargetId}/${Date.now()}-${randomUUID()}-${safeFileName}`
}

function getPublicFileUrl(publicUrl: string, objectKey: string) {
  return `${publicUrl.replace(/\/+$/g, "")}/${encodeObjectKey(objectKey)}`
}

function isAllowedPaymentProof(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf"
}

function isAllowedAttendanceDocumentation(file: File) {
  return file.type.startsWith("image/")
}

async function readTinyPngError(response: Response) {
  const text = await response.text().catch(() => "")

  if (!text) {
    return "Kompresi gambar belum berhasil."
  }

  try {
    const data = JSON.parse(text) as { message?: string; error?: string }
    return data.message ?? data.error ?? "Kompresi gambar belum berhasil."
  } catch {
    return text.length > 240 ? `${text.slice(0, 240)}...` : text
  }
}

async function compressImageWithTinyPng(fileBuffer: Buffer, contentType: string) {
  const apiKeys = getTinyPngApiKeys()

  if (apiKeys.length === 0) {
    throw new Error("Konfigurasi TinyPNG belum tersedia. Isi TINYPNG_API_KEYS di environment.")
  }

  let lastError = "Kompresi gambar belum berhasil."

  for (const apiKey of apiKeys) {
    const authorization = getTinyPngAuthorizationHeader(apiKey)
    const shrinkResponse = await fetch(TINYPNG_SHRINK_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
      },
      body: fileBuffer,
    }).catch(() => null)

    if (!shrinkResponse) {
      lastError = "TinyPNG belum bisa dihubungi."
      continue
    }

    if (shrinkResponse.status === 401 || shrinkResponse.status === 429) {
      lastError = await readTinyPngError(shrinkResponse)
      continue
    }

    if (!shrinkResponse.ok) {
      throw new Error(await readTinyPngError(shrinkResponse))
    }

    const compressedUrl = shrinkResponse.headers.get("location")

    if (!compressedUrl) {
      throw new Error("TinyPNG tidak mengembalikan URL hasil kompresi.")
    }

    const compressedResponse = await fetch(compressedUrl)

    if (!compressedResponse.ok) {
      throw new Error(await readTinyPngError(compressedResponse))
    }

    const compressedBuffer = Buffer.from(await compressedResponse.arrayBuffer())
    const compressedContentType = compressedResponse.headers.get("content-type") || contentType

    return {
      fileBuffer: compressedBuffer,
      contentType: compressedContentType,
      compressed: true,
    }
  }

  throw new Error(lastError)
}

async function verifyFirebaseUser(idToken: string, expectedUserId: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!apiKey) {
    throw new Error("Konfigurasi Firebase belum lengkap.")
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) {
    return false
  }

  const data = (await response.json().catch(() => null)) as FirebaseLookupResponse | null
  const uid = data?.users?.[0]?.localId

  return Boolean(uid && uid === expectedUserId)
}

function createR2AuthorizationHeader(params: {
  accessKeyId: string
  secretAccessKey: string
  dateStamp: string
  amzDate: string
  host: string
  canonicalUri: string
  contentType: string
  payloadHash: string
}) {
  const credentialScope = `${params.dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"
  const canonicalHeaders = [
    `content-type:${params.contentType}`,
    `host:${params.host}`,
    `x-amz-content-sha256:${params.payloadHash}`,
    `x-amz-date:${params.amzDate}`,
    "",
  ].join("\n")
  const canonicalRequest = [
    "PUT",
    params.canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    params.payloadHash,
  ].join("\n")
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    params.amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n")
  const signature = hmacHex(getSigningKey(params.secretAccessKey, params.dateStamp), stringToSign)

  return `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

async function uploadToR2(params: {
  fileBuffer: Buffer
  contentType: string
  objectKey: string
  config: UploadConfig
}) {
  const { amzDate, dateStamp } = getAmzDates()
  const host = `${params.config.accountId}.r2.cloudflarestorage.com`
  const canonicalUri = `/${encodePathSegment(params.config.bucketName)}/${encodeObjectKey(params.objectKey)}`
  const payloadHash = hashHex(params.fileBuffer)
  const authorization = createR2AuthorizationHeader({
    accessKeyId: params.config.accessKeyId,
    secretAccessKey: params.config.secretAccessKey,
    dateStamp,
    amzDate,
    host,
    canonicalUri,
    contentType: params.contentType,
    payloadHash,
  })

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": params.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: params.fileBuffer,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(errorText || "Upload ke R2 belum berhasil.")
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const userId = String(formData.get("userId") ?? "")
    const classId = String(formData.get("classId") ?? "")
    const classSlug = String(formData.get("classSlug") ?? "")
    const eventId = String(formData.get("eventId") ?? "")
    const eventSlug = String(formData.get("eventSlug") ?? "")
    const eventSessionId = String(formData.get("eventSessionId") ?? "")
    const uploadType = String(formData.get("uploadType") ?? "payment_proof")
    const idToken = String(formData.get("idToken") ?? "")
    const targetId = eventSessionId ? `${eventId || classId}-${eventSessionId}` : classId || eventId
    const isAttendanceUpload = uploadType === "event_attendance"

    if (!(file instanceof File)) {
      return jsonError(
        isAttendanceUpload ? "Foto dokumentasi wajib diupload." : "File bukti pembayaran wajib diupload.",
        400,
      )
    }

    if (!userId || !targetId || !idToken) {
      return jsonError("Data upload belum lengkap.", 400)
    }

    if (isAttendanceUpload ? !isAllowedAttendanceDocumentation(file) : !isAllowedPaymentProof(file)) {
      return jsonError(
        isAttendanceUpload
          ? "Format dokumentasi absensi harus berupa gambar."
          : "Format bukti pembayaran harus berupa gambar atau PDF.",
        400,
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        isAttendanceUpload
          ? "Ukuran foto dokumentasi harus di bawah 1,5 MB."
          : "Ukuran file upload harus di bawah 1,5 MB.",
        400,
      )
    }

    const isValidUser = await verifyFirebaseUser(idToken, userId)

    if (!isValidUser) {
      return jsonError(
        isAttendanceUpload
          ? "Sesi login tidak valid untuk upload dokumentasi absensi."
          : "Sesi login tidak valid untuk upload pembayaran.",
        401,
      )
    }

    const config = getUploadConfig()
    const originalFileBuffer = Buffer.from(await file.arrayBuffer())
    const originalContentType = file.type || "application/octet-stream"
    const uploadFile = file.type.startsWith("image/")
      ? await compressImageWithTinyPng(originalFileBuffer, originalContentType)
      : {
          fileBuffer: originalFileBuffer,
          contentType: originalContentType,
          compressed: false,
        }

    if (uploadFile.fileBuffer.byteLength > MAX_FILE_SIZE) {
      return jsonError("Ukuran file setelah kompresi harus di bawah 1,5 MB.", 400)
    }

    const objectKey = createObjectKey({
      fileName: file.name,
      userId,
      targetId,
      folder: isAttendanceUpload ? "event-attendances" : "payment-proofs",
    })

    await uploadToR2({
      fileBuffer: uploadFile.fileBuffer,
      contentType: uploadFile.contentType,
      objectKey,
      config,
    })

    const url = getPublicFileUrl(config.publicUrl, objectKey)

    return NextResponse.json({
      url,
      fileUrl: url,
      key: objectKey,
      fileName: file.name,
      contentType: uploadFile.contentType,
      size: uploadFile.fileBuffer.byteLength,
      originalSize: file.size,
      compressed: uploadFile.compressed,
      classId,
      classSlug,
      eventId,
      eventSlug,
      eventSessionId,
      uploadType,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Upload bukti pembayaran belum berhasil.",
      500,
    )
  }
}
