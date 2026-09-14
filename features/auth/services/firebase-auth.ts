export type AuthProvider = "password" | "google.com"

export type UserSession = {
  uid: string
  email: string
  displayName: string
  idToken: string
  refreshToken: string
  expiresAt: number
  provider: AuthProvider
}

export type UserProfileInput = {
  fullName: string
  nickname: string
  phoneCountryCode: string
  phoneNationalNumber: string
  phoneNumber: string
  email: string
  birthDate: string
  birthPlace: string
  ktpStreet: string
  ktpProvinceId: string
  ktpProvinceName: string
  ktpRegencyId: string
  ktpRegencyName: string
  ktpDistrictId: string
  ktpDistrictName: string
  ktpVillageId: string
  ktpVillageName: string
  ktpAddress: string
  domicileSameAsKtp: boolean
  domicileStreet: string
  domicileProvinceId: string
  domicileProvinceName: string
  domicileRegencyId: string
  domicileRegencyName: string
  domicileDistrictId: string
  domicileDistrictName: string
  domicileVillageId: string
  domicileVillageName: string
  domicileAddress: string
  lastEducation: string
}

export const emptyUserProfileInput: UserProfileInput = {
  fullName: "",
  nickname: "",
  phoneCountryCode: "+62",
  phoneNationalNumber: "",
  phoneNumber: "",
  email: "",
  birthDate: "",
  birthPlace: "",
  ktpStreet: "",
  ktpProvinceId: "",
  ktpProvinceName: "",
  ktpRegencyId: "",
  ktpRegencyName: "",
  ktpDistrictId: "",
  ktpDistrictName: "",
  ktpVillageId: "",
  ktpVillageName: "",
  ktpAddress: "",
  domicileSameAsKtp: false,
  domicileStreet: "",
  domicileProvinceId: "",
  domicileProvinceName: "",
  domicileRegencyId: "",
  domicileRegencyName: "",
  domicileDistrictId: "",
  domicileDistrictName: "",
  domicileVillageId: "",
  domicileVillageName: "",
  domicileAddress: "",
  lastEducation: "",
}

export type UserProfile = UserProfileInput & {
  uid: string
  role?: string
  status?: string
  createdBy?: string
  username?: string
  profileCompleted: boolean
  isProfileComplete?: boolean
  authProvider: AuthProvider
  createdAt?: string
  updatedAt?: string
}

type FirebaseAuthResponse = {
  idToken: string
  email?: string
  refreshToken: string
  expiresIn: string
  localId: string
  displayName?: string
}

type FirebaseRefreshResponse = {
  id_token: string
  refresh_token: string
  expires_in: string
  user_id: string
}

type FirebaseErrorResponse = {
  error?: {
    message?: string
  }
}

type FirestoreValue = {
  stringValue?: string
  booleanValue?: boolean
  timestampValue?: string
}

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>
}

const SESSION_STORAGE_KEY = "slangtech.auth.session"

const authErrorMessages: Record<string, string> = {
  EMAIL_EXISTS: "Email ini sudah terdaftar.",
  EMAIL_NOT_FOUND: "Email belum terdaftar.",
  INVALID_LOGIN_CREDENTIALS: "Email atau password belum sesuai.",
  INVALID_PASSWORD: "Email atau password belum sesuai.",
  INVALID_EMAIL: "Format email belum valid.",
  MISSING_PASSWORD: "Password wajib diisi.",
  WEAK_PASSWORD: "Password minimal 6 karakter.",
  POPUP_CLOSED_BY_USER: "Login Google dibatalkan.",
}

function getRequiredFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!apiKey || !projectId) {
    throw new Error("Konfigurasi Firebase belum lengkap.")
  }

  return { apiKey, projectId }
}

function getAuthUrl(action: string) {
  const { apiKey } = getRequiredFirebaseConfig()

  return `https://identitytoolkit.googleapis.com/v1/${action}?key=${apiKey}`
}

function getSecureTokenUrl() {
  const { apiKey } = getRequiredFirebaseConfig()

  return `https://securetoken.googleapis.com/v1/token?key=${apiKey}`
}

function getUserDocumentUrl(uid: string) {
  const { apiKey, projectId } = getRequiredFirebaseConfig()

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(
    uid,
  )}?key=${apiKey}`
}

async function readFirebaseError(response: Response) {
  const data = (await response.json().catch(() => null)) as FirebaseErrorResponse | null
  const rawMessage = data?.error?.message ?? "UNKNOWN_ERROR"
  const errorCode = rawMessage.split(" : ")[0]

  return authErrorMessages[errorCode] ?? "Terjadi kendala. Coba lagi sebentar lagi."
}

function createSession(authResponse: FirebaseAuthResponse, provider: AuthProvider): UserSession {
  return {
    uid: authResponse.localId,
    email: authResponse.email ?? "",
    displayName: authResponse.displayName ?? "",
    idToken: authResponse.idToken,
    refreshToken: authResponse.refreshToken,
    expiresAt: Date.now() + Number(authResponse.expiresIn) * 1000,
    provider,
  }
}

export function normalizePhoneCountryCode(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  return digits ? `+${digits}` : "+62"
}

export function normalizePhoneNationalNumber(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "")
}

export function composePhoneNumber(countryCode: string, nationalNumber: string) {
  const normalizedCountryCode = normalizePhoneCountryCode(countryCode)
  const normalizedNationalNumber = normalizePhoneNationalNumber(nationalNumber)

  return normalizedNationalNumber ? `${normalizedCountryCode}${normalizedNationalNumber}` : ""
}

export function composeAddress({
  street,
  villageName,
  districtName,
  regencyName,
  provinceName,
}: {
  street: string
  villageName: string
  districtName: string
  regencyName: string
  provinceName: string
}) {
  return [street, villageName, districtName, regencyName, provinceName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")
}

function splitPhoneNumber(phoneNumber: string) {
  const trimmedPhoneNumber = phoneNumber.trim()
  const digits = trimmedPhoneNumber.replace(/[^\d]/g, "")

  if (!digits) {
    return {
      phoneCountryCode: "+62",
      phoneNationalNumber: "",
    }
  }

  if (trimmedPhoneNumber.startsWith("+62") || digits.startsWith("62")) {
    return {
      phoneCountryCode: "+62",
      phoneNationalNumber: normalizePhoneNationalNumber(digits.replace(/^62/, "")),
    }
  }

  return {
    phoneCountryCode: "+62",
    phoneNationalNumber: normalizePhoneNationalNumber(digits),
  }
}

export function saveSession(session: UserSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as UserSession
  } catch {
    clearSession()
    return null
  }
}

export async function getValidSession() {
  const session = getStoredSession()

  if (!session) {
    return null
  }

  if (session.expiresAt > Date.now() + 60_000) {
    return session
  }

  const response = await fetch(getSecureTokenUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
  })

  if (!response.ok) {
    clearSession()
    return null
  }

  const data = (await response.json()) as FirebaseRefreshResponse
  const refreshedSession: UserSession = {
    ...session,
    uid: data.user_id,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  }

  saveSession(refreshedSession)
  return refreshedSession
}

export async function registerWithEmail(email: string, password: string) {
  const response = await fetch(getAuthUrl("accounts:signUp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  })

  if (!response.ok) {
    throw new Error(await readFirebaseError(response))
  }

  const data = (await response.json()) as FirebaseAuthResponse
  const session = createSession(data, "password")
  saveSession(session)

  return session
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch(getAuthUrl("accounts:signInWithPassword"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  })

  if (!response.ok) {
    throw new Error(await readFirebaseError(response))
  }

  const data = (await response.json()) as FirebaseAuthResponse
  const session = createSession(data, "password")
  saveSession(session)

  return session
}

function toFirestoreFields(profile: UserProfileInput, session: UserSession, existingProfile?: UserProfile | null) {
  const now = new Date().toISOString()
  const phoneCountryCode = normalizePhoneCountryCode(profile.phoneCountryCode)
  const phoneNationalNumber = normalizePhoneNationalNumber(profile.phoneNationalNumber || profile.phoneNumber)
  const phoneNumber = composePhoneNumber(phoneCountryCode, phoneNationalNumber)
  const ktpAddress = composeAddress({
    street: profile.ktpStreet,
    villageName: profile.ktpVillageName,
    districtName: profile.ktpDistrictName,
    regencyName: profile.ktpRegencyName,
    provinceName: profile.ktpProvinceName,
  })
  const domicileStreet = profile.domicileSameAsKtp ? profile.ktpStreet : profile.domicileStreet
  const domicileProvinceId = profile.domicileSameAsKtp ? profile.ktpProvinceId : profile.domicileProvinceId
  const domicileProvinceName = profile.domicileSameAsKtp ? profile.ktpProvinceName : profile.domicileProvinceName
  const domicileRegencyId = profile.domicileSameAsKtp ? profile.ktpRegencyId : profile.domicileRegencyId
  const domicileRegencyName = profile.domicileSameAsKtp ? profile.ktpRegencyName : profile.domicileRegencyName
  const domicileDistrictId = profile.domicileSameAsKtp ? profile.ktpDistrictId : profile.domicileDistrictId
  const domicileDistrictName = profile.domicileSameAsKtp ? profile.ktpDistrictName : profile.domicileDistrictName
  const domicileVillageId = profile.domicileSameAsKtp ? profile.ktpVillageId : profile.domicileVillageId
  const domicileVillageName = profile.domicileSameAsKtp ? profile.ktpVillageName : profile.domicileVillageName
  const domicileAddress = composeAddress({
    street: domicileStreet,
    villageName: domicileVillageName,
    districtName: domicileDistrictName,
    regencyName: domicileRegencyName,
    provinceName: domicileProvinceName,
  })

  return {
    uid: { stringValue: session.uid },
    fullName: { stringValue: profile.fullName.trim() },
    nickname: { stringValue: profile.nickname.trim() },
    phoneCountryCode: { stringValue: phoneCountryCode },
    phoneNationalNumber: { stringValue: phoneNationalNumber },
    phoneNumber: { stringValue: phoneNumber },
    email: { stringValue: profile.email.trim().toLowerCase() },
    birthDate: { stringValue: profile.birthDate },
    birthPlace: { stringValue: profile.birthPlace.trim() },
    ktpStreet: { stringValue: profile.ktpStreet.trim() },
    ktpProvinceId: { stringValue: profile.ktpProvinceId },
    ktpProvinceName: { stringValue: profile.ktpProvinceName },
    ktpRegencyId: { stringValue: profile.ktpRegencyId },
    ktpRegencyName: { stringValue: profile.ktpRegencyName },
    ktpDistrictId: { stringValue: profile.ktpDistrictId },
    ktpDistrictName: { stringValue: profile.ktpDistrictName },
    ktpVillageId: { stringValue: profile.ktpVillageId },
    ktpVillageName: { stringValue: profile.ktpVillageName },
    ktpAddress: { stringValue: ktpAddress },
    domicileSameAsKtp: { booleanValue: profile.domicileSameAsKtp },
    domicileStreet: { stringValue: domicileStreet.trim() },
    domicileProvinceId: { stringValue: domicileProvinceId },
    domicileProvinceName: { stringValue: domicileProvinceName },
    domicileRegencyId: { stringValue: domicileRegencyId },
    domicileRegencyName: { stringValue: domicileRegencyName },
    domicileDistrictId: { stringValue: domicileDistrictId },
    domicileDistrictName: { stringValue: domicileDistrictName },
    domicileVillageId: { stringValue: domicileVillageId },
    domicileVillageName: { stringValue: domicileVillageName },
    domicileAddress: { stringValue: domicileAddress },
    lastEducation: { stringValue: profile.lastEducation.trim() },
    authProvider: { stringValue: session.provider },
    profileCompleted: { booleanValue: true },
    isProfileComplete: { booleanValue: true },
    role: { stringValue: existingProfile?.role || "student" },
    status: { stringValue: existingProfile?.status || "active" },
    ...(existingProfile?.createdBy ? { createdBy: { stringValue: existingProfile.createdBy } } : {}),
    ...(existingProfile?.username ? { username: { stringValue: existingProfile.username } } : {}),
    createdAt: { timestampValue: existingProfile?.createdAt ?? now },
    updatedAt: { timestampValue: now },
  }
}

function getString(fields: Record<string, FirestoreValue>, key: string) {
  return fields[key]?.stringValue ?? ""
}

export async function getUserProfile(session: UserSession) {
  const response = await fetch(getUserDocumentUrl(session.uid), {
    headers: {
      Authorization: `Bearer ${session.idToken}`,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error("Profil belum bisa dibaca dari Firestore.")
  }

  const document = (await response.json()) as FirestoreDocument
  const fields = document.fields ?? {}
  const legacyPhoneParts = splitPhoneNumber(getString(fields, "phoneNumber"))
  const phoneCountryCode = getString(fields, "phoneCountryCode") || legacyPhoneParts.phoneCountryCode
  const phoneNationalNumber = getString(fields, "phoneNationalNumber") || legacyPhoneParts.phoneNationalNumber

  return {
    uid: getString(fields, "uid") || session.uid,
    fullName: getString(fields, "fullName"),
    nickname: getString(fields, "nickname"),
    phoneCountryCode,
    phoneNationalNumber,
    phoneNumber: composePhoneNumber(phoneCountryCode, phoneNationalNumber),
    email: getString(fields, "email") || session.email,
    birthDate: getString(fields, "birthDate"),
    birthPlace: getString(fields, "birthPlace"),
    ktpStreet: getString(fields, "ktpStreet") || getString(fields, "ktpAddress"),
    ktpProvinceId: getString(fields, "ktpProvinceId"),
    ktpProvinceName: getString(fields, "ktpProvinceName"),
    ktpRegencyId: getString(fields, "ktpRegencyId"),
    ktpRegencyName: getString(fields, "ktpRegencyName"),
    ktpDistrictId: getString(fields, "ktpDistrictId"),
    ktpDistrictName: getString(fields, "ktpDistrictName"),
    ktpVillageId: getString(fields, "ktpVillageId"),
    ktpVillageName: getString(fields, "ktpVillageName"),
    ktpAddress: getString(fields, "ktpAddress"),
    domicileSameAsKtp: fields.domicileSameAsKtp?.booleanValue ?? false,
    domicileStreet: getString(fields, "domicileStreet") || getString(fields, "domicileAddress"),
    domicileProvinceId: getString(fields, "domicileProvinceId"),
    domicileProvinceName: getString(fields, "domicileProvinceName"),
    domicileRegencyId: getString(fields, "domicileRegencyId"),
    domicileRegencyName: getString(fields, "domicileRegencyName"),
    domicileDistrictId: getString(fields, "domicileDistrictId"),
    domicileDistrictName: getString(fields, "domicileDistrictName"),
    domicileVillageId: getString(fields, "domicileVillageId"),
    domicileVillageName: getString(fields, "domicileVillageName"),
    domicileAddress: getString(fields, "domicileAddress"),
    lastEducation: getString(fields, "lastEducation"),
    authProvider: (getString(fields, "authProvider") || session.provider) as AuthProvider,
    role: getString(fields, "role") || "student",
    status: getString(fields, "status") || "active",
    createdBy: getString(fields, "createdBy") || undefined,
    username: getString(fields, "username") || undefined,
    profileCompleted: fields.profileCompleted?.booleanValue ?? false,
    isProfileComplete: fields.isProfileComplete?.booleanValue ?? fields.profileCompleted?.booleanValue ?? false,
    createdAt: fields.createdAt?.timestampValue,
    updatedAt: fields.updatedAt?.timestampValue,
  } satisfies UserProfile
}

export async function saveUserProfile(session: UserSession, profile: UserProfileInput) {
  const existingProfile = await getUserProfile(session).catch(() => null)
  const response = await fetch(getUserDocumentUrl(session.uid), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: toFirestoreFields(profile, session, existingProfile),
    }),
  })

  if (!response.ok) {
    throw new Error("Profil belum bisa disimpan ke Firestore. Periksa rules Firestore untuk user login.")
  }
}

export function isProfileComplete(profile: UserProfile | null) {
  return Boolean(
    profile?.fullName &&
      profile.nickname &&
      profile.phoneCountryCode &&
      profile.phoneNationalNumber &&
      profile.phoneNumber &&
      profile.email &&
      profile.birthDate &&
      profile.birthPlace &&
      profile.ktpStreet &&
      profile.ktpProvinceId &&
      profile.ktpRegencyId &&
      profile.ktpDistrictId &&
      profile.ktpVillageId &&
      (profile.domicileSameAsKtp ||
        (profile.domicileStreet &&
          profile.domicileProvinceId &&
          profile.domicileRegencyId &&
          profile.domicileDistrictId &&
          profile.domicileVillageId)) &&
      profile.lastEducation,
  )
}
