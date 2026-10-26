import type { Class, ClassType, LocalizedText } from "@/features/classes/services/classes"
import type { Event, EventPriceType, EventSession, EventTrainer } from "@/features/events/services/events"
import type { UserProfile, UserSession } from "@/features/auth/services/firebase-auth"

export type PaymentMethod = "manual" | "payment_gateway"

export type EnrollmentStatus =
  | "waiting_payment_confirmation"
  | "confirmed"
  | "cancelled"
  | "completed"

export type PaymentStatus =
  | "waiting_confirmation"
  | "pending"
  | "paid"
  | "failed"
  | "expired"

export type ManualPaymentDetails = {
  bankName: string
  accountNumber: string
  accountHolderName: string
  senderBankName?: string
  senderAccountName?: string
  proofUrl: string
  proofFileName: string
  proofContentType: string
  proofSize: number
  uploadedAt: string
  uploadResponse: string
}

export type GatewayPaymentDetails = {
  provider: string
  transactionId: string
  paymentUrl: string
  expiresAt?: string
}

export type ScheduleLocationType = "online" | "offline"

export type ScheduleSessionStatus =
  | "scheduled"
  | "rescheduled"
  | "completed"
  | "cancelled"

export type EnrollmentScheduleStatus =
  | "pending_admin_assignment"
  | "assigned"
  | "reschedule_requested"
  | "completed"
  | "cancelled"

export type RescheduleRequestStatus =
  | "pending_admin_approval"
  | "approved"
  | "rejected"
  | "cancelled"

export type EnrollmentScheduleSession = {
  id: string
  sessionNumber: number
  title: string
  startsAt: string
  endsAt: string
  timezone: string
  teacherName: string
  locationType: ScheduleLocationType
  locationLabel: string
  meetingUrl: string
  status: ScheduleSessionStatus
  notes: string
}

export type ReschedulePreferredSlot = {
  startsAt: string
  endsAt?: string | null
  timezone: string
  note?: string | null
}

export type EnrollmentRescheduleRequest = {
  id: string
  status: RescheduleRequestStatus
  requestedBy: string
  requestedAt: string
  targetSessionId: string
  reason: string
  preferredSlots: ReschedulePreferredSlot[]
  adminNote?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  approvedSession?: EnrollmentScheduleSession | null
}

export type EnrollmentSchedule = {
  status: EnrollmentScheduleStatus
  timezone: string
  assignedAt?: string | null
  assignedBy?: string | null
  startDate?: string | null
  sessions: EnrollmentScheduleSession[]
  rescheduleRequest?: EnrollmentRescheduleRequest | null
}

export type EnrollmentPayment =
  | {
      method: "manual"
      status: Extract<PaymentStatus, "waiting_confirmation" | "paid" | "failed">
      amount: number
      currency: "IDR"
      manual: ManualPaymentDetails
      gateway: null
    }
  | {
      method: "payment_gateway"
      status: Extract<PaymentStatus, "pending" | "paid" | "failed" | "expired">
      amount: number
      currency: "IDR"
      manual: null
      gateway: GatewayPaymentDetails
    }

export type EnrollmentClassSnapshot = {
  id: string
  slug: string
  name: LocalizedText
  displayName: string
  type: ClassType
  level: string
  price: number
  discountPrice: number | null
  selectedPrice: number
  totalSessions: number
  sessionDurationMinutes: number
}

export type ClassEnrollment = {
  id: string
  uid: string
  classId: string
  classSlug: string
  status: EnrollmentStatus
  reason: string
  studentSnapshot: Partial<UserProfile>
  classSnapshot: EnrollmentClassSnapshot
  payment: EnrollmentPayment
  schedule: EnrollmentSchedule | null
  createdAt: string
  updatedAt: string
}

export type EventEnrollmentStatus =
  | "registered"
  | "waiting_payment_confirmation"
  | "confirmed"
  | "cancelled"
  | "completed"

export type EventEnrollmentEventSnapshot = {
  id: string
  slug: string
  name: LocalizedText
  displayName: string
  priceType: EventPriceType
  price: number
  selectedPrice: number
  startsAt: string
  timezone: string
  trainers: EventTrainer[]
  sessions: EventSession[]
}

export type FreeEventPayment = {
  method: "free"
  status: "not_required"
  amount: 0
  currency: "IDR"
  manual: null
  gateway: null
}

export type PaidEventPayment = EnrollmentPayment

export type EventEnrollmentPayment = FreeEventPayment | PaidEventPayment

export type EventSessionAttendance = {
  sessionKey: string
  sessionId: string
  sessionNumber: number
  materialSummary: string
  documentationUrl: string
  documentationFileName: string
  documentationContentType: string
  documentationSize: number
  submittedAt: string
  updatedAt: string
}

export type EventEnrollment = {
  id: string
  uid: string
  eventId: string
  eventSlug: string
  status: EventEnrollmentStatus
  reason: string
  studentSnapshot: Partial<UserProfile>
  eventSnapshot: EventEnrollmentEventSnapshot
  payment: EventEnrollmentPayment
  eventAttendances: Record<string, EventSessionAttendance>
  createdAt: string
  updatedAt: string
}

export type EventEnrollmentPaymentStatus = PaymentStatus | "not_required"

export type ClassEnrollmentInput = {
  classItem: Class
  profile: UserProfile
  reason: string
  payment: EnrollmentPayment
}

export type EventEnrollmentInput = {
  eventItem: Event
  profile: UserProfile
  reason: string
  payment: EventEnrollmentPayment
}

export type EventSessionAttendanceInput = {
  enrollment: EventEnrollment
  sessionItem: EventSession
  materialSummary: string
  documentationFile: File
}

export type RescheduleRequestInput = {
  enrollmentId: string
  targetSessionId: string
  reason: string
  preferredSlots: Array<{
    startsAt: string
    endsAt?: string | null
    note?: string | null
  }>
}

type FirestoreWriteValue = {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
  arrayValue?: {
    values?: FirestoreWriteValue[]
  }
  mapValue?: {
    fields?: Record<string, FirestoreWriteValue>
  }
}

type FirestoreCompatibleObject = {
  [key: string]: FirestoreCompatibleValue | undefined
}

type FirestoreCompatibleValue =
  | string
  | number
  | boolean
  | Date
  | null
  | FirestoreCompatibleValue[]
  | FirestoreCompatibleObject

type UploadPaymentResponse = Record<string, unknown>

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreWriteValue>
  createTime?: string
  updateTime?: string
}

type FirestoreRunQueryRow = {
  document?: FirestoreDocument
}

const ENROLLMENTS_COLLECTION = "enrollments"
const PAYMENT_UPLOAD_URL = "/api/upload-payment"
const ZAWA_MESSAGE_URL = "/api/zawa/message"
const ZAWA_MESSAGE_TIMEOUT_MS = 8000
const DEFAULT_TIMEZONE = "Asia/Jakarta"

export const manualPaymentAccount = {
  bankName: "Bank Syariah Indonesia (BSI)",
  accountNumber: "7359003662",
  accountHolderName: "PT SLANG TECH INDONESIA",
} as const

function getRequiredFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!apiKey || !projectId) {
    throw new Error("Konfigurasi Firebase belum lengkap.")
  }

  return { apiKey, projectId }
}

function getEnrollmentDocumentUrl(enrollmentId: string) {
  const { apiKey, projectId } = getRequiredFirebaseConfig()

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENROLLMENTS_COLLECTION}/${encodeURIComponent(
    enrollmentId,
  )}?key=${apiKey}`
}

function getEnrollmentsRunQueryUrl() {
  const { apiKey, projectId } = getRequiredFirebaseConfig()

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`
}

function getEnrollmentDocumentPatchUrl(enrollmentId: string, fieldPaths: string[]) {
  const params = new URLSearchParams()
  fieldPaths.forEach((fieldPath) => params.append("updateMask.fieldPaths", fieldPath))

  return `${getEnrollmentDocumentUrl(enrollmentId)}&${params.toString()}`
}

function createEnrollmentId(uid: string, classId: string) {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  return `${uid}_${classId}_${Date.now()}_${randomValue}`.replace(/[^a-zA-Z0-9_-]/g, "_")
}

function createEventEnrollmentId(uid: string, eventId: string) {
  return `${uid}_${eventId}`.replace(/[^a-zA-Z0-9_-]/g, "_")
}

function createEventAttendanceSessionKey(sessionItem: Pick<EventSession, "id" | "sessionNumber">) {
  return `${sessionItem.id || `session-${sessionItem.sessionNumber || "unknown"}`}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  )
}

function isEventAttendanceWindowOpen(value: string) {
  const startsAt = new Date(value)

  if (Number.isNaN(startsAt.getTime())) {
    return false
  }

  const now = Date.now()
  const startsAtTime = startsAt.getTime()
  const closesAtTime = startsAtTime + 3 * 24 * 60 * 60 * 1000

  return now >= startsAtTime && now <= closesAtTime
}

function isActiveClassEnrollment(enrollment: ClassEnrollment) {
  return enrollment.status !== "cancelled"
}

function isActiveEventEnrollment(enrollment: EventEnrollment) {
  return enrollment.status !== "cancelled"
}

function createRescheduleRequestId(uid: string, enrollmentId: string) {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  return `${uid}_${enrollmentId}_reschedule_${Date.now()}_${randomValue}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  )
}

function toFirestoreValue(value: FirestoreCompatibleValue): FirestoreWriteValue {
  if (value === null) {
    return { nullValue: null }
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() }
  }

  if (typeof value === "string") {
    return { stringValue: value }
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }

  if (typeof value === "boolean") {
    return { booleanValue: value }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    }
  }

  return {
    mapValue: {
      fields: toFirestoreFields(value),
    },
  }
}

function toFirestoreFields(value: FirestoreCompatibleObject) {
  return Object.entries(value).reduce<Record<string, FirestoreWriteValue>>((fields, [key, fieldValue]) => {
    if (typeof fieldValue === "undefined") {
      return fields
    }

    fields[key] = toFirestoreValue(fieldValue)
    return fields
  }, {})
}

function getSelectedClassPrice(classItem: Class) {
  return classItem.discountPrice ?? classItem.price
}

function getSelectedEventPrice(eventItem: Event) {
  return eventItem.priceType === "free" ? 0 : eventItem.price
}

function getLocalizedName(classItem: Class) {
  return classItem.name.id || classItem.name.en || classItem.name.zh
}

function getLocalizedEventName(eventItem: Event) {
  return eventItem.name.id || eventItem.name.en || eventItem.name.zh
}

function stringifyUploadResponse(value: unknown) {
  const serialized = JSON.stringify(value ?? {}) ?? "{}"
  return serialized.length > 4000 ? `${serialized.slice(0, 4000)}...` : serialized
}

function createLocalizedTextSnapshot(text: LocalizedText): FirestoreCompatibleObject {
  return {
    id: text.id,
    en: text.en,
    zh: text.zh,
  }
}

function createClassSnapshot(classItem: Class): FirestoreCompatibleObject {
  return {
    id: classItem.id,
    slug: classItem.slug || classItem.id,
    name: createLocalizedTextSnapshot(classItem.name),
    displayName: getLocalizedName(classItem),
    type: classItem.type,
    level: classItem.level,
    price: classItem.price,
    discountPrice: classItem.discountPrice ?? null,
    selectedPrice: getSelectedClassPrice(classItem),
    totalSessions: classItem.totalSessions,
    sessionDurationMinutes: classItem.sessionDurationMinutes,
  }
}

function createEventSessionSnapshot(session: EventSession): FirestoreCompatibleObject {
  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    title: session.title,
    startsAt: session.startsAt,
    timezone: session.timezone,
    notes: session.notes,
  }
}

function createEventTrainerSnapshot(trainer: EventTrainer): FirestoreCompatibleObject {
  return {
    id: trainer.id,
    name: trainer.name,
  }
}

function createEventSnapshot(eventItem: Event): FirestoreCompatibleObject {
  return {
    id: eventItem.id,
    slug: eventItem.slug || eventItem.id,
    name: createLocalizedTextSnapshot(eventItem.name),
    displayName: getLocalizedEventName(eventItem),
    priceType: eventItem.priceType,
    price: eventItem.price,
    selectedPrice: getSelectedEventPrice(eventItem),
    startsAt: eventItem.startsAt,
    timezone: eventItem.timezone,
    trainers: eventItem.trainers.map(createEventTrainerSnapshot),
    sessions: eventItem.sessions.map(createEventSessionSnapshot),
  }
}

function createStudentSnapshot(profile: UserProfile): FirestoreCompatibleObject {
  return {
    uid: profile.uid,
    fullName: profile.fullName,
    nickname: profile.nickname,
    email: profile.email,
    phoneCountryCode: profile.phoneCountryCode,
    phoneNationalNumber: profile.phoneNationalNumber,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    birthPlace: profile.birthPlace,
    ktpStreet: profile.ktpStreet,
    ktpProvinceId: profile.ktpProvinceId,
    ktpProvinceName: profile.ktpProvinceName,
    ktpRegencyId: profile.ktpRegencyId,
    ktpRegencyName: profile.ktpRegencyName,
    ktpDistrictId: profile.ktpDistrictId,
    ktpDistrictName: profile.ktpDistrictName,
    ktpVillageId: profile.ktpVillageId,
    ktpVillageName: profile.ktpVillageName,
    ktpAddress: profile.ktpAddress,
    domicileSameAsKtp: profile.domicileSameAsKtp,
    domicileStreet: profile.domicileStreet,
    domicileProvinceId: profile.domicileProvinceId,
    domicileProvinceName: profile.domicileProvinceName,
    domicileRegencyId: profile.domicileRegencyId,
    domicileRegencyName: profile.domicileRegencyName,
    domicileDistrictId: profile.domicileDistrictId,
    domicileDistrictName: profile.domicileDistrictName,
    domicileVillageId: profile.domicileVillageId,
    domicileVillageName: profile.domicileVillageName,
    domicileAddress: profile.domicileAddress,
    lastEducation: profile.lastEducation,
  }
}

function createManualPaymentSnapshot(payment: ManualPaymentDetails): FirestoreCompatibleObject {
  return {
    bankName: payment.bankName,
    accountNumber: payment.accountNumber,
    accountHolderName: payment.accountHolderName,
    senderBankName: payment.senderBankName || null,
    senderAccountName: payment.senderAccountName || null,
    proofUrl: payment.proofUrl,
    proofFileName: payment.proofFileName,
    proofContentType: payment.proofContentType,
    proofSize: payment.proofSize,
    uploadedAt: payment.uploadedAt,
    uploadResponse: payment.uploadResponse,
  }
}

function createGatewayPaymentSnapshot(payment: GatewayPaymentDetails): FirestoreCompatibleObject {
  return {
    provider: payment.provider,
    transactionId: payment.transactionId,
    paymentUrl: payment.paymentUrl,
    expiresAt: payment.expiresAt,
  }
}

function createPaymentSnapshot(payment: EnrollmentPayment): FirestoreCompatibleObject {
  if (payment.method === "manual") {
    return {
      method: payment.method,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      manual: createManualPaymentSnapshot(payment.manual),
      gateway: null,
    }
  }

  return {
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    manual: null,
    gateway: createGatewayPaymentSnapshot(payment.gateway),
  }
}

function createEventPaymentSnapshot(payment: EventEnrollmentPayment): FirestoreCompatibleObject {
  if (payment.method === "free") {
    return {
      method: "free",
      status: "not_required",
      amount: 0,
      currency: "IDR",
      manual: null,
      gateway: null,
    }
  }

  return createPaymentSnapshot(payment)
}

function createPendingScheduleSnapshot(): FirestoreCompatibleObject {
  return {
    status: "pending_admin_assignment",
    timezone: DEFAULT_TIMEZONE,
    assignedAt: null,
    assignedBy: null,
    startDate: null,
    sessions: [],
    rescheduleRequest: null,
  }
}

function fromFirestoreValue(value?: FirestoreWriteValue): unknown {
  if (!value) {
    return undefined
  }

  if (typeof value.stringValue === "string") {
    return value.stringValue
  }

  if (typeof value.integerValue === "string") {
    const parsed = Number(value.integerValue)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value.doubleValue === "number") {
    return value.doubleValue
  }

  if (typeof value.booleanValue === "boolean") {
    return value.booleanValue
  }

  if (typeof value.timestampValue === "string") {
    return value.timestampValue
  }

  if ("nullValue" in value) {
    return null
  }

  if (value.arrayValue) {
    return (value.arrayValue.values ?? []).map(fromFirestoreValue)
  }

  if (value.mapValue) {
    return Object.entries(value.mapValue.fields ?? {}).reduce<Record<string, unknown>>(
      (result, [key, fieldValue]) => {
        result[key] = fromFirestoreValue(fieldValue)
        return result
      },
      {},
    )
  }

  return undefined
}

function getDocumentId(path: string) {
  return path.split("/").pop() ?? path
}

function getDocumentFields(document: FirestoreDocument) {
  return Object.entries(document.fields ?? {}).reduce<Record<string, unknown>>(
    (fields, [key, value]) => {
      fields[key] = fromFirestoreValue(value)
      return fields
    },
    {},
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function asStringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return (
    value === "waiting_payment_confirmation" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  )
}

function isEventEnrollmentStatus(value: string): value is EventEnrollmentStatus {
  return (
    value === "registered" ||
    value === "waiting_payment_confirmation" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  )
}

function isManualPaymentStatus(value: string): value is Extract<PaymentStatus, "waiting_confirmation" | "paid" | "failed"> {
  return value === "waiting_confirmation" || value === "paid" || value === "failed"
}

function isGatewayPaymentStatus(value: string): value is Extract<PaymentStatus, "pending" | "paid" | "failed" | "expired"> {
  return value === "pending" || value === "paid" || value === "failed" || value === "expired"
}

function isClassType(value: string): value is ClassType {
  return value === "private" || value === "group"
}

function isEventPriceType(value: string): value is EventPriceType {
  return value === "free" || value === "paid"
}

function isScheduleStatus(value: string): value is EnrollmentScheduleStatus {
  return (
    value === "pending_admin_assignment" ||
    value === "assigned" ||
    value === "reschedule_requested" ||
    value === "completed" ||
    value === "cancelled"
  )
}

function isScheduleSessionStatus(value: string): value is ScheduleSessionStatus {
  return (
    value === "scheduled" ||
    value === "rescheduled" ||
    value === "completed" ||
    value === "cancelled"
  )
}

function isLocationType(value: string): value is ScheduleLocationType {
  return value === "online" || value === "offline"
}

function isRescheduleRequestStatus(value: string): value is RescheduleRequestStatus {
  return (
    value === "pending_admin_approval" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled"
  )
}

function mapLocalizedText(value: unknown): LocalizedText {
  const fields = asRecord(value)

  return {
    id: asString(fields.id),
    en: asString(fields.en),
    zh: asString(fields.zh),
  }
}

function mapStudentSnapshot(value: unknown): Partial<UserProfile> {
  const fields = asRecord(value)

  return {
    uid: asString(fields.uid),
    fullName: asString(fields.fullName),
    nickname: asString(fields.nickname),
    email: asString(fields.email),
    phoneCountryCode: asString(fields.phoneCountryCode),
    phoneNationalNumber: asString(fields.phoneNationalNumber),
    phoneNumber: asString(fields.phoneNumber),
    birthDate: asString(fields.birthDate),
    birthPlace: asString(fields.birthPlace),
    ktpStreet: asString(fields.ktpStreet),
    ktpProvinceId: asString(fields.ktpProvinceId),
    ktpProvinceName: asString(fields.ktpProvinceName),
    ktpRegencyId: asString(fields.ktpRegencyId),
    ktpRegencyName: asString(fields.ktpRegencyName),
    ktpDistrictId: asString(fields.ktpDistrictId),
    ktpDistrictName: asString(fields.ktpDistrictName),
    ktpVillageId: asString(fields.ktpVillageId),
    ktpVillageName: asString(fields.ktpVillageName),
    ktpAddress: asString(fields.ktpAddress),
    domicileSameAsKtp: Boolean(fields.domicileSameAsKtp),
    domicileStreet: asString(fields.domicileStreet),
    domicileProvinceId: asString(fields.domicileProvinceId),
    domicileProvinceName: asString(fields.domicileProvinceName),
    domicileRegencyId: asString(fields.domicileRegencyId),
    domicileRegencyName: asString(fields.domicileRegencyName),
    domicileDistrictId: asString(fields.domicileDistrictId),
    domicileDistrictName: asString(fields.domicileDistrictName),
    domicileVillageId: asString(fields.domicileVillageId),
    domicileVillageName: asString(fields.domicileVillageName),
    domicileAddress: asString(fields.domicileAddress),
    lastEducation: asString(fields.lastEducation),
  }
}

function mapClassSnapshot(value: unknown): EnrollmentClassSnapshot {
  const fields = asRecord(value)
  const type = asString(fields.type, "private")
  const name = mapLocalizedText(fields.name)
  const selectedPrice = asNumber(fields.selectedPrice, asNumber(fields.price))

  return {
    id: asString(fields.id),
    slug: asString(fields.slug, asString(fields.id)),
    name,
    displayName:
      asString(fields.displayName) || name.id || name.en || name.zh || "Kelas LKP SlangTech",
    type: isClassType(type) ? type : "private",
    level: asString(fields.level),
    price: asNumber(fields.price),
    discountPrice: asNullableNumber(fields.discountPrice),
    selectedPrice,
    totalSessions: asNumber(fields.totalSessions),
    sessionDurationMinutes: asNumber(fields.sessionDurationMinutes),
  }
}

function mapEventTrainer(value: unknown): EventTrainer | null {
  const fields = asRecord(value)
  const id = asString(fields.id)
  const name = asString(fields.name)

  if (!id && !name) {
    return null
  }

  return { id, name }
}

function mapEventSession(value: unknown): EventSession | null {
  const fields = asRecord(value)
  const id = asString(fields.id)
  const startsAt = asString(fields.startsAt)

  if (!id && !startsAt) {
    return null
  }

  return {
    id,
    sessionNumber: asNumber(fields.sessionNumber),
    title: asString(fields.title),
    startsAt,
    timezone: asString(fields.timezone, DEFAULT_TIMEZONE),
    notes: asString(fields.notes),
  }
}

function mapEventSnapshot(value: unknown): EventEnrollmentEventSnapshot {
  const fields = asRecord(value)
  const name = mapLocalizedText(fields.name)
  const priceType = asString(fields.priceType, "free")
  const selectedPrice = asNumber(fields.selectedPrice, asNumber(fields.price))

  return {
    id: asString(fields.id),
    slug: asString(fields.slug, asString(fields.id)),
    name,
    displayName:
      asString(fields.displayName) || name.id || name.en || name.zh || "Event LKP SlangTech",
    priceType: isEventPriceType(priceType) ? priceType : "free",
    price: asNumber(fields.price),
    selectedPrice,
    startsAt: asString(fields.startsAt),
    timezone: asString(fields.timezone, DEFAULT_TIMEZONE),
    trainers: asArray(fields.trainers)
      .map(mapEventTrainer)
      .filter((trainer): trainer is EventTrainer => trainer !== null),
    sessions: asArray(fields.sessions)
      .map(mapEventSession)
      .filter((session): session is EventSession => session !== null)
      .sort((firstSession, secondSession) => firstSession.sessionNumber - secondSession.sessionNumber),
  }
}

function mapManualPayment(value: unknown): ManualPaymentDetails {
  const fields = asRecord(value)

  return {
    bankName: asString(fields.bankName),
    accountNumber: asString(fields.accountNumber),
    accountHolderName: asString(fields.accountHolderName),
    senderBankName: asString(fields.senderBankName) || undefined,
    senderAccountName: asString(fields.senderAccountName) || undefined,
    proofUrl: asString(fields.proofUrl),
    proofFileName: asString(fields.proofFileName),
    proofContentType: asString(fields.proofContentType),
    proofSize: asNumber(fields.proofSize),
    uploadedAt: asString(fields.uploadedAt),
    uploadResponse: asString(fields.uploadResponse),
  }
}

function mapGatewayPayment(value: unknown): GatewayPaymentDetails {
  const fields = asRecord(value)

  return {
    provider: asString(fields.provider),
    transactionId: asString(fields.transactionId),
    paymentUrl: asString(fields.paymentUrl),
    expiresAt: asString(fields.expiresAt) || undefined,
  }
}

function mapPayment(value: unknown): EnrollmentPayment {
  const fields = asRecord(value)
  const method = asString(fields.method, "manual")
  const status = asString(fields.status)
  const amount = asNumber(fields.amount)

  if (method === "payment_gateway") {
    return {
      method: "payment_gateway",
      status: isGatewayPaymentStatus(status) ? status : "pending",
      amount,
      currency: "IDR",
      manual: null,
      gateway: mapGatewayPayment(fields.gateway),
    }
  }

  return {
    method: "manual",
    status: isManualPaymentStatus(status) ? status : "waiting_confirmation",
    amount,
    currency: "IDR",
    manual: mapManualPayment(fields.manual),
    gateway: null,
  }
}

function mapEventPayment(value: unknown): EventEnrollmentPayment {
  const fields = asRecord(value)

  if (asString(fields.method) === "free") {
    return {
      method: "free",
      status: "not_required",
      amount: 0,
      currency: "IDR",
      manual: null,
      gateway: null,
    }
  }

  return mapPayment(value)
}

function mapEventSessionAttendance(value: unknown): EventSessionAttendance | null {
  const fields = asRecord(value)
  const sessionKey = asString(fields.sessionKey)
  const documentationUrl = asString(fields.documentationUrl)

  if (!sessionKey || !documentationUrl) {
    return null
  }

  return {
    sessionKey,
    sessionId: asString(fields.sessionId),
    sessionNumber: asNumber(fields.sessionNumber),
    materialSummary: asString(fields.materialSummary),
    documentationUrl,
    documentationFileName: asString(fields.documentationFileName),
    documentationContentType: asString(fields.documentationContentType),
    documentationSize: asNumber(fields.documentationSize),
    submittedAt: asString(fields.submittedAt),
    updatedAt: asString(fields.updatedAt),
  }
}

function mapEventAttendances(value: unknown): Record<string, EventSessionAttendance> {
  const fields = asRecord(value)

  return Object.entries(fields).reduce<Record<string, EventSessionAttendance>>((attendances, [key, fieldValue]) => {
    const attendance = mapEventSessionAttendance(fieldValue)

    if (attendance) {
      attendances[key] = attendance
    }

    return attendances
  }, {})
}

function mapScheduleSession(value: unknown): EnrollmentScheduleSession | null {
  const fields = asRecord(value)
  const id = asString(fields.id)
  const startsAt = asString(fields.startsAt)
  const endsAt = asString(fields.endsAt)
  const locationType = asString(fields.locationType, "online")
  const status = asString(fields.status, "scheduled")

  if (!id || !startsAt) {
    return null
  }

  return {
    id,
    sessionNumber: asNumber(fields.sessionNumber),
    title: asString(fields.title, "Sesi Belajar"),
    startsAt,
    endsAt,
    timezone: asString(fields.timezone, DEFAULT_TIMEZONE),
    teacherName: asString(fields.teacherName),
    locationType: isLocationType(locationType) ? locationType : "online",
    locationLabel: asString(fields.locationLabel),
    meetingUrl: asString(fields.meetingUrl),
    status: isScheduleSessionStatus(status) ? status : "scheduled",
    notes: asString(fields.notes),
  }
}

function mapPreferredSlot(value: unknown): ReschedulePreferredSlot | null {
  const fields = asRecord(value)
  const startsAt = asString(fields.startsAt)

  if (!startsAt) {
    return null
  }

  return {
    startsAt,
    endsAt: asStringOrNull(fields.endsAt),
    timezone: asString(fields.timezone, DEFAULT_TIMEZONE),
    note: asStringOrNull(fields.note),
  }
}

function mapRescheduleRequest(value: unknown): EnrollmentRescheduleRequest | null {
  const fields = asRecord(value)
  const id = asString(fields.id)
  const requestedAt = asString(fields.requestedAt)
  const status = asString(fields.status, "pending_admin_approval")
  const approvedSession = mapScheduleSession(fields.approvedSession)

  if (!id || !requestedAt) {
    return null
  }

  return {
    id,
    status: isRescheduleRequestStatus(status) ? status : "pending_admin_approval",
    requestedBy: asString(fields.requestedBy),
    requestedAt,
    targetSessionId: asString(fields.targetSessionId),
    reason: asString(fields.reason),
    preferredSlots: asArray(fields.preferredSlots)
      .map(mapPreferredSlot)
      .filter((slot): slot is ReschedulePreferredSlot => slot !== null),
    adminNote: asStringOrNull(fields.adminNote),
    reviewedBy: asStringOrNull(fields.reviewedBy),
    reviewedAt: asStringOrNull(fields.reviewedAt),
    approvedSession,
  }
}

function mapSchedule(value: unknown): EnrollmentSchedule | null {
  if (value === null || typeof value === "undefined") {
    return null
  }

  const fields = asRecord(value)
  const status = asString(fields.status, "pending_admin_assignment")

  return {
    status: isScheduleStatus(status) ? status : "pending_admin_assignment",
    timezone: asString(fields.timezone, DEFAULT_TIMEZONE),
    assignedAt: asStringOrNull(fields.assignedAt),
    assignedBy: asStringOrNull(fields.assignedBy),
    startDate: asStringOrNull(fields.startDate),
    sessions: asArray(fields.sessions)
      .map(mapScheduleSession)
      .filter((session): session is EnrollmentScheduleSession => session !== null)
      .sort((firstSession, secondSession) => firstSession.sessionNumber - secondSession.sessionNumber),
    rescheduleRequest: mapRescheduleRequest(fields.rescheduleRequest),
  }
}

function mapEnrollmentDocument(document: FirestoreDocument): ClassEnrollment {
  const fields = getDocumentFields(document)
  const status = asString(fields.status, "waiting_payment_confirmation")

  return {
    id: asString(fields.id, getDocumentId(document.name)),
    uid: asString(fields.uid),
    classId: asString(fields.classId),
    classSlug: asString(fields.classSlug),
    status: isEnrollmentStatus(status) ? status : "waiting_payment_confirmation",
    reason: asString(fields.reason),
    studentSnapshot: mapStudentSnapshot(fields.studentSnapshot),
    classSnapshot: mapClassSnapshot(fields.classSnapshot),
    payment: mapPayment(fields.payment),
    schedule: mapSchedule(fields.schedule),
    createdAt: asString(fields.createdAt, document.createTime ?? ""),
    updatedAt: asString(fields.updatedAt, document.updateTime ?? ""),
  }
}

function mapEventEnrollmentDocument(document: FirestoreDocument): EventEnrollment {
  const fields = getDocumentFields(document)
  const status = asString(fields.status, "registered")

  return {
    id: asString(fields.id, getDocumentId(document.name)),
    uid: asString(fields.uid),
    eventId: asString(fields.eventId),
    eventSlug: asString(fields.eventSlug),
    status: isEventEnrollmentStatus(status) ? status : "registered",
    reason: asString(fields.reason),
    studentSnapshot: mapStudentSnapshot(fields.studentSnapshot),
    eventSnapshot: mapEventSnapshot(fields.eventSnapshot),
    payment: mapEventPayment(fields.payment),
    eventAttendances: mapEventAttendances(fields.eventAttendances),
    createdAt: asString(fields.createdAt, document.createTime ?? ""),
    updatedAt: asString(fields.updatedAt, document.updateTime ?? ""),
  }
}

function isClassEnrollmentDocument(document: FirestoreDocument) {
  const fields = getDocumentFields(document)
  return Boolean(fields.classId || fields.classSnapshot)
}

function isEventEnrollmentDocument(document: FirestoreDocument) {
  const fields = getDocumentFields(document)
  return Boolean(fields.eventId || fields.eventSnapshot)
}

function getComparableDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

async function readFirestoreError(response: Response, fallback: string) {
  const text = await response.text().catch(() => "")

  if (!text) {
    return fallback
  }

  try {
    const data = JSON.parse(text) as { error?: { message?: string }; message?: string }
    return data.error?.message ?? data.message ?? fallback
  } catch {
    return text.length > 240 ? `${text.slice(0, 240)}...` : text
  }
}

async function readUploadError(response: Response) {
  const text = await response.text().catch(() => "")

  if (!text) {
    return "Upload bukti pembayaran belum berhasil."
  }

  try {
    const data = JSON.parse(text) as { message?: string; error?: string }
    return data.message ?? data.error ?? "Upload bukti pembayaran belum berhasil."
  } catch {
    return text.length > 240 ? `${text.slice(0, 240)}...` : text
  }
}

async function readUploadResponse(response: Response): Promise<UploadPaymentResponse> {
  const text = await response.text().catch(() => "")

  if (!text) {
    return {}
  }

  try {
    const parsed = JSON.parse(text) as unknown

    if (typeof parsed === "string") {
      return {
        url: parsed,
      }
    }

    if (parsed && typeof parsed === "object") {
      return parsed as UploadPaymentResponse
    }

    return {
      value: parsed,
    }
  } catch {
    return {
      url: text.trim(),
    }
  }
}

function findUploadUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const urlKeys = ["url", "fileUrl", "paymentProofUrl", "secure_url", "path"]

  for (const key of urlKeys) {
    const maybeUrl = record[key]

    if (typeof maybeUrl === "string" && maybeUrl.length > 0) {
      return maybeUrl
    }
  }

  for (const fieldValue of Object.values(record)) {
    const nestedUrl = findUploadUrl(fieldValue)

    if (nestedUrl) {
      return nestedUrl
    }
  }

  return null
}

function getUploadString(value: unknown, key: string, fallback = "") {
  const record = asRecord(value)
  return asString(record[key], fallback)
}

function getUploadNumber(value: unknown, key: string, fallback = 0) {
  const record = asRecord(value)
  return asNumber(record[key], fallback)
}

export async function uploadPaymentProof(params: {
  file: File
  session: UserSession
  classItem: Class
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  formData.append("userId", params.session.uid)
  formData.append("classId", params.classItem.id)
  formData.append("classSlug", params.classItem.slug || params.classItem.id)
  formData.append("paymentMethod", "manual")
  formData.append("idToken", params.session.idToken)

  const response = await fetch(PAYMENT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readUploadError(response))
  }

  const data = await readUploadResponse(response)
  const proofUrl = findUploadUrl(data)

  if (!proofUrl) {
    throw new Error("Upload berhasil, tetapi URL bukti pembayaran tidak ditemukan dari response API.")
  }

  return {
    proofUrl,
    proofFileName: getUploadString(data, "fileName", params.file.name),
    proofContentType: getUploadString(data, "contentType", params.file.type || "application/octet-stream"),
    proofSize: getUploadNumber(data, "size", params.file.size),
    rawResponse: data,
  }
}

export async function uploadEventPaymentProof(params: {
  file: File
  session: UserSession
  eventItem: Event
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  formData.append("userId", params.session.uid)
  formData.append("eventId", params.eventItem.id)
  formData.append("eventSlug", params.eventItem.slug || params.eventItem.id)
  formData.append("paymentMethod", "manual")
  formData.append("idToken", params.session.idToken)

  const response = await fetch(PAYMENT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readUploadError(response))
  }

  const data = await readUploadResponse(response)
  const proofUrl = findUploadUrl(data)

  if (!proofUrl) {
    throw new Error("Upload berhasil, tetapi URL bukti pembayaran tidak ditemukan dari response API.")
  }

  return {
    proofUrl,
    proofFileName: getUploadString(data, "fileName", params.file.name),
    proofContentType: getUploadString(data, "contentType", params.file.type || "application/octet-stream"),
    proofSize: getUploadNumber(data, "size", params.file.size),
    rawResponse: data,
  }
}

export async function uploadEventAttendanceDocumentation(params: {
  file: File
  session: UserSession
  enrollment: EventEnrollment
  sessionItem: EventSession
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  formData.append("userId", params.session.uid)
  formData.append("eventId", params.enrollment.eventId)
  formData.append("eventSlug", params.enrollment.eventSlug)
  formData.append("eventSessionId", createEventAttendanceSessionKey(params.sessionItem))
  formData.append("uploadType", "event_attendance")
  formData.append("idToken", params.session.idToken)

  const response = await fetch(PAYMENT_UPLOAD_URL, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readUploadError(response))
  }

  const data = await readUploadResponse(response)
  const documentationUrl = findUploadUrl(data)

  if (!documentationUrl) {
    throw new Error("Upload berhasil, tetapi URL dokumentasi tidak ditemukan dari response API.")
  }

  return {
    documentationUrl,
    documentationFileName: getUploadString(data, "fileName", params.file.name),
    documentationContentType: getUploadString(data, "contentType", params.file.type || "application/octet-stream"),
    documentationSize: getUploadNumber(data, "size", params.file.size),
    rawResponse: data,
  }
}

export function createManualEnrollmentPayment(params: {
  classItem: Class
  proofUrl: string
  proofFile: File
  uploadResponse: unknown
  senderBankName?: string
  senderAccountName?: string
}): EnrollmentPayment {
  return {
    method: "manual",
    status: "waiting_confirmation",
    amount: getSelectedClassPrice(params.classItem),
    currency: "IDR",
    manual: {
      ...manualPaymentAccount,
      senderBankName: params.senderBankName?.trim() || undefined,
      senderAccountName: params.senderAccountName?.trim() || undefined,
      proofUrl: params.proofUrl,
      proofFileName: getUploadString(params.uploadResponse, "fileName", params.proofFile.name),
      proofContentType: getUploadString(
        params.uploadResponse,
        "contentType",
        params.proofFile.type || "application/octet-stream",
      ),
      proofSize: getUploadNumber(params.uploadResponse, "size", params.proofFile.size),
      uploadedAt: new Date().toISOString(),
      uploadResponse: stringifyUploadResponse(params.uploadResponse),
    },
    gateway: null,
  }
}

export function createFreeEventPayment(): FreeEventPayment {
  return {
    method: "free",
    status: "not_required",
    amount: 0,
    currency: "IDR",
    manual: null,
    gateway: null,
  }
}

export function createManualEventEnrollmentPayment(params: {
  eventItem: Event
  proofUrl: string
  proofFile: File
  uploadResponse: unknown
}): PaidEventPayment {
  return {
    method: "manual",
    status: "waiting_confirmation",
    amount: getSelectedEventPrice(params.eventItem),
    currency: "IDR",
    manual: {
      ...manualPaymentAccount,
      proofUrl: params.proofUrl,
      proofFileName: getUploadString(params.uploadResponse, "fileName", params.proofFile.name),
      proofContentType: getUploadString(
        params.uploadResponse,
        "contentType",
        params.proofFile.type || "application/octet-stream",
      ),
      proofSize: getUploadNumber(params.uploadResponse, "size", params.proofFile.size),
      uploadedAt: new Date().toISOString(),
      uploadResponse: stringifyUploadResponse(params.uploadResponse),
    },
    gateway: null,
  }
}

function formatEventEmailDate(value: string, timezone = DEFAULT_TIMEZONE) {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return "Jadwal segera diumumkan"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date)
}

function formatEventEmailPrice(eventItem: Event) {
  const selectedPrice = getSelectedEventPrice(eventItem)

  if (selectedPrice <= 0) {
    return "Gratis"
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(selectedPrice)
}

function formatClassEmailPrice(classItem: Class) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(getSelectedClassPrice(classItem))
}

function formatClassEmailSessionInfo(classItem: Class) {
  const totalSessions = classItem.totalSessions > 0 ? `${classItem.totalSessions} sesi` : "Jumlah sesi menyusul"
  const duration =
    classItem.sessionDurationMinutes > 0 ? `${classItem.sessionDurationMinutes} menit per sesi` : "durasi menyusul"

  return `${totalSessions}, ${duration}`
}

function getZawaPhoneNumber(profile: UserProfile) {
  const digits = (profile.phoneNumber || `${profile.phoneCountryCode}${profile.phoneNationalNumber}`).replace(
    /[^\d]/g,
    "",
  )

  return digits.replace(/^0+/, "")
}

function createRegistrationZawaText(params: {
  profile: UserProfile
  registrationType: "class" | "event"
  itemName: string
}) {
  const participantName = params.profile.fullName || params.profile.nickname || "Kak"
  const itemLabel = params.registrationType === "class" ? "kelas" : "event"

  return [
    `Halo ${participantName},`,
    "",
    `Pendaftaran ${itemLabel} ${params.itemName} telah kami terima.`,
    "",
    "Terima kasih telah bergabung bersama SlangTech.",
    "",
    "Informasi selanjutnya akan segera kami kirimkan setelah proses verifikasi selesai.",
  ].join("\n")
}

export async function sendRegistrationZawaMessage(params: {
  session: UserSession
  profile: UserProfile
  registrationType: "class" | "event"
  itemName: string
}) {
  const phone = getZawaPhoneNumber(params.profile)

  if (!phone) {
    throw new Error("Nomor telepon peserta belum tersedia untuk notifikasi Zawa.")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ZAWA_MESSAGE_TIMEOUT_MS)

  const response = await fetch(ZAWA_MESSAGE_URL, {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: params.session.idToken,
      uid: params.session.uid,
      phone,
      type: "text",
      text: createRegistrationZawaText(params),
    }),
  }).finally(() => {
    clearTimeout(timeoutId)
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || "Notifikasi Zawa belum berhasil dikirim.")
  }
}

export async function sendClassRegistrationEmail(params: {
  session: UserSession
  profile: UserProfile
  classItem: Class
  enrollmentId: string
}) {
  const response = await fetch("/api/class-registration-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken: params.session.idToken,
      uid: params.session.uid,
      email: params.profile.email || params.session.email,
      fullName: params.profile.fullName || params.session.displayName || params.session.email,
      enrollmentId: params.enrollmentId,
      className: getLocalizedName(params.classItem),
      classPrice: formatClassEmailPrice(params.classItem),
      classSessionInfo: formatClassEmailSessionInfo(params.classItem),
      dashboardUrl: `${window.location.origin}/home`,
    }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || "Email pendaftaran kelas belum berhasil dikirim.")
  }
}

export async function sendEventRegistrationEmail(params: {
  session: UserSession
  profile: UserProfile
  eventItem: Event
  enrollmentId: string
}) {
  const response = await fetch("/api/event-registration-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken: params.session.idToken,
      uid: params.session.uid,
      email: params.profile.email || params.session.email,
      fullName: params.profile.fullName || params.session.displayName || params.session.email,
      eventName: getLocalizedEventName(params.eventItem),
      enrollmentId: params.enrollmentId,
      eventDate: formatEventEmailDate(params.eventItem.startsAt, params.eventItem.timezone),
      eventPrice: formatEventEmailPrice(params.eventItem),
      dashboardUrl: `${window.location.origin}/home`,
    }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || "Email pendaftaran event belum berhasil dikirim.")
  }
}

async function getUserEnrollmentDocuments(session: UserSession) {
  const response = await fetch(getEnrollmentsRunQueryUrl(), {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [
          {
            collectionId: ENROLLMENTS_COLLECTION,
          },
        ],
        where: {
          fieldFilter: {
            field: {
              fieldPath: "uid",
            },
            op: "EQUAL",
            value: {
              stringValue: session.uid,
            },
          },
        },
        limit: 100,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(
      await readFirestoreError(
        response,
        "Data enrollment belum bisa dibaca. Pastikan rules Firestore mengizinkan user membaca enrollment miliknya.",
      ),
    )
  }

  const rows = (await response.json()) as FirestoreRunQueryRow[]

  return rows
    .map((row) => row.document)
    .filter((document): document is FirestoreDocument => Boolean(document))
}

async function getUserEventEnrollmentDocumentsByEvent(session: UserSession, eventId: string) {
  const deterministicEnrollmentId = createEventEnrollmentId(session.uid, eventId)
  const response = await fetch(getEnrollmentDocumentUrl(deterministicEnrollmentId), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
    },
  })

  if (response.ok) {
    return [(await response.json()) as FirestoreDocument]
  }

  if (response.status !== 404) {
    throw new Error(
      await readFirestoreError(
        response,
        "Data enrollment event belum bisa dibaca. Pastikan rules Firestore mengizinkan user membaca enrollment miliknya.",
      ),
    )
  }

  const documents = await getUserEnrollmentDocuments(session)

  return documents.filter((document) => {
    const fields = document.fields ?? {}
    return fromFirestoreValue(fields.eventId) === eventId
  })
}

async function getUserClassEnrollmentDocumentsByClass(
  session: UserSession,
  classItem: Pick<Class, "id" | "slug">,
) {
  const documents = await getUserEnrollmentDocuments(session)

  return documents.filter((document) => {
    const fields = document.fields ?? {}
    const classSnapshot = asRecord(fromFirestoreValue(fields.classSnapshot))
    const classId = fromFirestoreValue(fields.classId)
    const classSlug = fromFirestoreValue(fields.classSlug)

    return (
      classId === classItem.id ||
      (Boolean(classItem.slug) && classSlug === classItem.slug) ||
      classSnapshot.id === classItem.id ||
      (Boolean(classItem.slug) && classSnapshot.slug === classItem.slug)
    )
  })
}

export async function getUserEnrollments(session: UserSession) {
  const documents = await getUserEnrollmentDocuments(session)

  return documents
    .filter(isClassEnrollmentDocument)
    .map(mapEnrollmentDocument)
    .sort((firstEnrollment, secondEnrollment) => {
      return getComparableDate(secondEnrollment.createdAt) - getComparableDate(firstEnrollment.createdAt)
    })
}

export async function getUserEventEnrollments(session: UserSession) {
  const documents = await getUserEnrollmentDocuments(session)

  return documents
    .filter(isEventEnrollmentDocument)
    .map(mapEventEnrollmentDocument)
    .sort((firstEnrollment, secondEnrollment) => {
      return getComparableDate(secondEnrollment.createdAt) - getComparableDate(firstEnrollment.createdAt)
    })
}

export async function getExistingActiveClassEnrollment(session: UserSession, classItem: Pick<Class, "id" | "slug">) {
  const classEnrollments = (await getUserClassEnrollmentDocumentsByClass(session, classItem))
    .filter(isClassEnrollmentDocument)
    .map(mapEnrollmentDocument)

  return (
    classEnrollments.find((enrollment) => {
      return isActiveClassEnrollment(enrollment)
    }) ?? null
  )
}

export async function getExistingActiveEventEnrollment(session: UserSession, eventItem: Pick<Event, "id" | "slug">) {
  const eventEnrollments = (await getUserEventEnrollmentDocumentsByEvent(session, eventItem.id))
    .filter(isEventEnrollmentDocument)
    .map(mapEventEnrollmentDocument)

  return (
    eventEnrollments.find((enrollment) => {
      return isActiveEventEnrollment(enrollment)
    }) ?? null
  )
}

export async function getUserEnrollmentOverview(session: UserSession) {
  const documents = await getUserEnrollmentDocuments(session)
  const classEnrollments = documents
    .filter(isClassEnrollmentDocument)
    .map(mapEnrollmentDocument)
    .sort((firstEnrollment, secondEnrollment) => {
      return getComparableDate(secondEnrollment.createdAt) - getComparableDate(firstEnrollment.createdAt)
    })
  const eventEnrollments = documents
    .filter(isEventEnrollmentDocument)
    .map(mapEventEnrollmentDocument)
    .sort((firstEnrollment, secondEnrollment) => {
      return getComparableDate(secondEnrollment.createdAt) - getComparableDate(firstEnrollment.createdAt)
    })

  return {
    classEnrollments,
    eventEnrollments,
  }
}

export async function requestEnrollmentReschedule(
  session: UserSession,
  input: RescheduleRequestInput,
) {
  const reason = input.reason.trim()
  const preferredSlots: FirestoreCompatibleObject[] = input.preferredSlots
    .map((slot) => ({
      startsAt: slot.startsAt,
      endsAt: slot.endsAt ?? null,
      timezone: DEFAULT_TIMEZONE,
      note: slot.note?.trim() || null,
    }))
    .filter((slot) => slot.startsAt)

  if (!input.enrollmentId || !input.targetSessionId) {
    throw new Error("Pilih sesi yang ingin di-reschedule dulu.")
  }

  if (!reason) {
    throw new Error("Alasan reschedule wajib diisi.")
  }

  if (preferredSlots.length === 0) {
    throw new Error("Isi minimal satu opsi jadwal pengganti.")
  }

  const now = new Date()
  const rescheduleRequestId = createRescheduleRequestId(session.uid, input.enrollmentId)
  const rescheduleRequest = {
    id: rescheduleRequestId,
    status: "pending_admin_approval",
    requestedBy: session.uid,
    requestedAt: now,
    targetSessionId: input.targetSessionId,
    reason,
    preferredSlots,
    adminNote: null,
    reviewedBy: null,
    reviewedAt: null,
    approvedSession: null,
  } satisfies FirestoreCompatibleObject
  const patch = {
    schedule: {
      status: "reschedule_requested",
      rescheduleRequest,
    },
    updatedAt: now,
  } satisfies FirestoreCompatibleObject

  const response = await fetch(
    getEnrollmentDocumentPatchUrl(input.enrollmentId, [
      "schedule.status",
      "schedule.rescheduleRequest",
      "updatedAt",
    ]),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: toFirestoreFields(patch),
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      await readFirestoreError(
        response,
        "Request reschedule belum bisa dikirim. Pastikan rules Firestore mengizinkan user memperbarui request reschedule miliknya.",
      ),
    )
  }

  return rescheduleRequestId
}

export async function submitEventSessionAttendance(session: UserSession, input: EventSessionAttendanceInput) {
  if (input.enrollment.uid && input.enrollment.uid !== session.uid) {
    throw new Error("Kamu tidak punya akses untuk mengirim absensi event ini.")
  }

  const materialSummary = input.materialSummary.trim()

  if (!materialSummary) {
    throw new Error("Materi yang didapat wajib diisi.")
  }

  if (!isEventAttendanceWindowOpen(input.sessionItem.startsAt)) {
    throw new Error("Absensi sesi ini hanya bisa dilakukan pada hari event sampai 3 hari setelahnya.")
  }

  if (!input.documentationFile.type.startsWith("image/")) {
    throw new Error("Dokumentasi absensi wajib berupa foto/gambar.")
  }

  const sessionKey = createEventAttendanceSessionKey(input.sessionItem)
  const uploadResult = await uploadEventAttendanceDocumentation({
    file: input.documentationFile,
    session,
    enrollment: input.enrollment,
    sessionItem: input.sessionItem,
  })
  const now = new Date()
  const nowIso = now.toISOString()
  const existingAttendance = input.enrollment.eventAttendances[sessionKey]
  const attendance = {
    sessionKey,
    sessionId: input.sessionItem.id || "",
    sessionNumber: input.sessionItem.sessionNumber || 0,
    materialSummary,
    documentationUrl: uploadResult.documentationUrl,
    documentationFileName: uploadResult.documentationFileName,
    documentationContentType: uploadResult.documentationContentType,
    documentationSize: uploadResult.documentationSize,
    submittedAt: existingAttendance?.submittedAt || nowIso,
    updatedAt: nowIso,
  } satisfies FirestoreCompatibleObject
  const eventAttendances = Object.entries(input.enrollment.eventAttendances).reduce<FirestoreCompatibleObject>(
    (attendances, [key, value]) => {
      attendances[key] = value as unknown as FirestoreCompatibleObject
      return attendances
    },
    {},
  )
  eventAttendances[sessionKey] = attendance
  const patch = {
    eventAttendances,
    updatedAt: now,
  } satisfies FirestoreCompatibleObject

  const response = await fetch(getEnrollmentDocumentPatchUrl(input.enrollment.id, ["eventAttendances", "updatedAt"]), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: toFirestoreFields(patch),
    }),
  })

  if (!response.ok) {
    throw new Error(
      await readFirestoreError(
        response,
        "Absensi event belum bisa dikirim. Pastikan rules Firestore mengizinkan user memperbarui enrollment miliknya.",
      ),
    )
  }

  return attendance as EventSessionAttendance
}

export async function saveClassEnrollment(session: UserSession, input: ClassEnrollmentInput) {
  const existingEnrollment = await getExistingActiveClassEnrollment(session, input.classItem)

  if (existingEnrollment) {
    throw new Error("Kamu sudah terdaftar di kelas ini. Detailnya bisa dicek di dashboard.")
  }

  const now = new Date()
  const enrollmentId = createEnrollmentId(session.uid, input.classItem.id)
  const status: EnrollmentStatus = "waiting_payment_confirmation"

  const enrollment = {
    id: enrollmentId,
    uid: session.uid,
    classId: input.classItem.id,
    classSlug: input.classItem.slug || input.classItem.id,
    status,
    reason: input.reason.trim(),
    studentSnapshot: createStudentSnapshot(input.profile),
    classSnapshot: createClassSnapshot(input.classItem),
    payment: createPaymentSnapshot(input.payment),
    schedule: createPendingScheduleSnapshot(),
    createdAt: now,
    updatedAt: now,
  } satisfies Record<string, FirestoreCompatibleValue>

  const response = await fetch(getEnrollmentDocumentUrl(enrollmentId), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: toFirestoreFields(enrollment),
    }),
  })

  if (!response.ok) {
    throw new Error(
      "Pendaftaran belum bisa disimpan. Pastikan rules Firestore mengizinkan user login membuat dokumen enrollments.",
    )
  }

  return enrollmentId
}

export async function saveEventEnrollment(session: UserSession, input: EventEnrollmentInput) {
  const existingEnrollment = await getExistingActiveEventEnrollment(session, input.eventItem)

  if (existingEnrollment) {
    throw new Error("Kamu sudah terdaftar di event ini. Detailnya bisa dicek di dashboard.")
  }

  const now = new Date()
  const enrollmentId = createEventEnrollmentId(session.uid, input.eventItem.id)
  const status: EventEnrollmentStatus =
    input.payment.method === "free" ? "registered" : "waiting_payment_confirmation"

  const enrollment = {
    id: enrollmentId,
    uid: session.uid,
    eventId: input.eventItem.id,
    eventSlug: input.eventItem.slug || input.eventItem.id,
    status,
    reason: input.reason.trim(),
    studentSnapshot: createStudentSnapshot(input.profile),
    eventSnapshot: createEventSnapshot(input.eventItem),
    payment: createEventPaymentSnapshot(input.payment),
    eventAttendances: {},
    createdAt: now,
    updatedAt: now,
  } satisfies Record<string, FirestoreCompatibleValue>

  const response = await fetch(getEnrollmentDocumentUrl(enrollmentId), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: toFirestoreFields(enrollment),
    }),
  })

  if (!response.ok) {
    throw new Error(
      await readFirestoreError(
        response,
        "Pendaftaran event belum bisa disimpan. Pastikan rules Firestore mengizinkan user login membuat dokumen enrollments.",
      ),
    )
  }

  return enrollmentId
}
