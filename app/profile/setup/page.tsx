"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Edit3, Mail, MapPin, Phone, UserRound } from "lucide-react"

import { emptyProfileInput, ProfileForm } from "@/features/auth/components/profile-form"
import { Button } from "@/components/ui/button"
import { LoadingCard } from "@/components/ui/spinner"
import { Navigation } from "@/components/layout/navigation"
import { createAuthRedirectPath, getReturnToFromLocation } from "@/features/auth/services/auth-redirect"
import {
  getUserProfile,
  getValidSession,
  isProfileComplete,
  saveUserProfile,
  type UserProfileInput,
  type UserSession,
} from "@/features/auth/services/firebase-auth"

const profileSections = [
  {
    title: "Identitas",
    items: [
      { label: "Nama Lengkap", field: "fullName" },
      { label: "Nama Panggilan", field: "nickname" },
      { label: "Email", field: "email" },
      { label: "Nomor Telepon", field: "phoneNumber" },
    ],
  },
  {
    title: "Data Pribadi",
    items: [
      { label: "Tanggal Lahir", field: "birthDate" },
      { label: "Tempat Lahir", field: "birthPlace" },
      { label: "Pendidikan Terakhir", field: "lastEducation" },
    ],
  },
  {
    title: "Alamat",
    items: [
      { label: "Alamat KTP", field: "ktpAddress" },
      { label: "Alamat Domisili", field: "domicileAddress" },
    ],
  },
] satisfies Array<{
  title: string
  items: Array<{
    label: string
    field: keyof UserProfileInput
  }>
}>

export default function ProfileSetupPage() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>("student")
  const [profile, setProfile] = useState<UserProfileInput>(emptyProfileInput)
  const [draftProfile, setDraftProfile] = useState<UserProfileInput>(emptyProfileInput)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProfileSummary, setShowProfileSummary] = useState(false)

  useEffect(() => {
    async function prepareProfileForm() {
      const nextPath = getReturnToFromLocation()
      setReturnTo(nextPath)

      const validSession = await getValidSession().catch(() => null)

      if (!validSession) {
        router.push(createAuthRedirectPath("/login", nextPath))
        return
      }

      setSession(validSession)

      const existingProfile = await getUserProfile(validSession).catch(() => null)
      const profileIsComplete = isProfileComplete(existingProfile)

      if (profileIsComplete && nextPath) {
        router.replace(nextPath)
        return
      }

      setUserRole(existingProfile?.role || "student")
      setShowProfileSummary(profileIsComplete)
      const profileInput = {
        fullName: existingProfile?.fullName || validSession.displayName || "",
        nickname: existingProfile?.nickname || existingProfile?.username || "",
        phoneCountryCode: existingProfile?.phoneCountryCode || "+62",
        phoneNationalNumber: existingProfile?.phoneNationalNumber || "",
        phoneNumber: existingProfile?.phoneNumber || "",
        email: existingProfile?.email || validSession.email,
        birthDate: existingProfile?.birthDate || "",
        birthPlace: existingProfile?.birthPlace || "",
        ktpStreet: existingProfile?.ktpStreet || "",
        ktpProvinceId: existingProfile?.ktpProvinceId || "",
        ktpProvinceName: existingProfile?.ktpProvinceName || "",
        ktpRegencyId: existingProfile?.ktpRegencyId || "",
        ktpRegencyName: existingProfile?.ktpRegencyName || "",
        ktpDistrictId: existingProfile?.ktpDistrictId || "",
        ktpDistrictName: existingProfile?.ktpDistrictName || "",
        ktpVillageId: existingProfile?.ktpVillageId || "",
        ktpVillageName: existingProfile?.ktpVillageName || "",
        ktpAddress: existingProfile?.ktpAddress || "",
        domicileSameAsKtp: existingProfile?.domicileSameAsKtp || false,
        domicileStreet: existingProfile?.domicileStreet || "",
        domicileProvinceId: existingProfile?.domicileProvinceId || "",
        domicileProvinceName: existingProfile?.domicileProvinceName || "",
        domicileRegencyId: existingProfile?.domicileRegencyId || "",
        domicileRegencyName: existingProfile?.domicileRegencyName || "",
        domicileDistrictId: existingProfile?.domicileDistrictId || "",
        domicileDistrictName: existingProfile?.domicileDistrictName || "",
        domicileVillageId: existingProfile?.domicileVillageId || "",
        domicileVillageName: existingProfile?.domicileVillageName || "",
        domicileAddress: existingProfile?.domicileAddress || "",
        lastEducation: existingProfile?.lastEducation || "",
      }

      setProfile(profileInput)
      setDraftProfile(profileInput)
      setIsLoading(false)
    }

    prepareProfileForm()
  }, [router])

  const updateDraftProfile = <Field extends keyof UserProfileInput>(
    field: Field,
    value: UserProfileInput[Field],
  ) => {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }))
  }

  const handleSubmit = async (profileInput: UserProfileInput) => {
    if (!session) {
      router.push(createAuthRedirectPath("/login", returnTo))
      return
    }

    setErrorMessage("")
    setIsSubmitting(true)

    try {
      await saveUserProfile(session, profileInput)
      setProfile(profileInput)
      setDraftProfile(profileInput)
      router.push(returnTo ?? "/home")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil belum berhasil disimpan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 pt-28 md:p-10 md:pt-32">
      <Navigation />
      <div className={showProfileSummary ? "w-full max-w-2xl" : "w-full max-w-sm"}>
        {errorMessage && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <LoadingCard
            title="Menyiapkan form profil..."
            description="Kami cek akun dan data profil kamu dulu sebentar."
          />
        ) : showProfileSummary ? (
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-mint text-primary">
                  <UserRound className="size-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-normal text-foreground">
                    {profile.fullName || "Profile"}
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    {userRole === "teacher" && (
                      <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-xs font-bold text-primary">
                        Guru / Pengajar
                      </span>
                    )}
                    {profile.nickname && (
                      <p className="text-sm font-bold text-primary">@{profile.nickname}</p>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="size-4 text-primary" />
                      {profile.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="size-4 text-primary" />
                      {profile.phoneNumber}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      {profile.birthPlace}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  setErrorMessage("")
                  setDraftProfile(profile)
                  setShowProfileSummary(false)
                }}
              >
                <Edit3 className="size-4" />
                Edit
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              {profileSections.map((section) => (
                <div key={section.title} className="rounded-md border border-border bg-brand-surface p-4">
                  <h2 className="text-sm font-black text-foreground">{section.title}</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {section.items.map((item) => (
                      <div
                        key={item.field}
                        className={item.field.includes("Address") ? "sm:col-span-2" : ""}
                      >
                        <p className="text-sm font-bold text-foreground">{item.label}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                          {profile[item.field] || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <ProfileForm
            value={draftProfile}
            isSubmitting={isSubmitting}
            submitLabel="Simpan Profil"
            onChange={updateDraftProfile}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}
