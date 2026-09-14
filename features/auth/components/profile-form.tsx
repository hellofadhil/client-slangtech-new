"use client"

import { Save, UserRound } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  composePhoneNumber,
  normalizePhoneCountryCode,
  normalizePhoneNationalNumber,
  type UserProfileInput,
} from "@/features/auth/services/firebase-auth"
import {
  getDistricts,
  getProvinces,
  getRegencies,
  getVillages,
  type IndonesiaRegion,
} from "@/features/auth/services/indonesia-regions"

type ProfileFormProps = {
  value: UserProfileInput
  isSubmitting: boolean
  submitLabel: string
  onChange: <Field extends keyof UserProfileInput>(field: Field, value: UserProfileInput[Field]) => void
  onSubmit: (profile: UserProfileInput) => void
}

type StepField = Exclude<keyof UserProfileInput, "domicileSameAsKtp">

const steps: Array<{
  title: string
  description: string
  fields: StepField[]
}> = [
  {
    title: "Data Kontak",
    description: "Isi data dasar akun learner.",
    fields: ["fullName", "nickname", "phoneCountryCode", "phoneNationalNumber", "email"],
  },
  {
    title: "Data Pribadi",
    description: "Lengkapi tempat lahir, tanggal lahir, dan pendidikan.",
    fields: ["birthDate", "birthPlace", "lastEducation"],
  },
  {
    title: "Alamat",
    description: "Masukkan alamat KTP dan domisili.",
    fields: [
      "ktpStreet",
      "ktpProvinceId",
      "ktpRegencyId",
      "ktpDistrictId",
      "ktpVillageId",
      "domicileStreet",
      "domicileProvinceId",
      "domicileRegencyId",
      "domicileDistrictId",
      "domicileVillageId",
    ],
  },
]

export const emptyProfileInput: UserProfileInput = {
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

function isStepComplete(value: UserProfileInput, stepIndex: number) {
  if (stepIndex === 2 && value.domicileSameAsKtp) {
    return ["ktpStreet", "ktpProvinceId", "ktpRegencyId", "ktpDistrictId", "ktpVillageId"].every(
      (field) => value[field as StepField].trim().length > 0,
    )
  }

  return steps[stepIndex].fields.every((field) => value[field].trim().length > 0)
}

type AddressKind = "ktp" | "domicile"

type AddressSelectorProps = {
  title: string
  value: UserProfileInput
  kind: AddressKind
  disabled?: boolean
  onChange: ProfileFormProps["onChange"]
}

function findRegionName(regions: IndonesiaRegion[], id: string) {
  return regions.find((region) => region.id === id)?.name ?? ""
}

function AddressSelector({ title, value, kind, disabled = false, onChange }: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<IndonesiaRegion[]>([])
  const [regencies, setRegencies] = useState<IndonesiaRegion[]>([])
  const [districts, setDistricts] = useState<IndonesiaRegion[]>([])
  const [villages, setVillages] = useState<IndonesiaRegion[]>([])
  const [loadError, setLoadError] = useState("")

  const fields = useMemo(
    () => ({
      street: `${kind}Street` as keyof UserProfileInput,
      provinceId: `${kind}ProvinceId` as keyof UserProfileInput,
      provinceName: `${kind}ProvinceName` as keyof UserProfileInput,
      regencyId: `${kind}RegencyId` as keyof UserProfileInput,
      regencyName: `${kind}RegencyName` as keyof UserProfileInput,
      districtId: `${kind}DistrictId` as keyof UserProfileInput,
      districtName: `${kind}DistrictName` as keyof UserProfileInput,
      villageId: `${kind}VillageId` as keyof UserProfileInput,
      villageName: `${kind}VillageName` as keyof UserProfileInput,
    }),
    [kind],
  )

  const provinceId = String(value[fields.provinceId] ?? "")
  const regencyId = String(value[fields.regencyId] ?? "")
  const districtId = String(value[fields.districtId] ?? "")

  useEffect(() => {
    let isMounted = true

    getProvinces()
      .then((items) => {
        if (isMounted) {
          setProvinces(items)
          setLoadError("")
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Data provinsi belum bisa dimuat.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setRegencies([])
    setDistricts([])
    setVillages([])

    if (!provinceId) {
      return () => {
        isMounted = false
      }
    }

    getRegencies(provinceId)
      .then((items) => {
        if (isMounted) {
          setRegencies(items)
          setLoadError("")
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Data kabupaten/kota belum bisa dimuat.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [provinceId])

  useEffect(() => {
    let isMounted = true
    setDistricts([])
    setVillages([])

    if (!regencyId) {
      return () => {
        isMounted = false
      }
    }

    getDistricts(regencyId)
      .then((items) => {
        if (isMounted) {
          setDistricts(items)
          setLoadError("")
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Data kecamatan belum bisa dimuat.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [regencyId])

  useEffect(() => {
    let isMounted = true
    setVillages([])

    if (!districtId) {
      return () => {
        isMounted = false
      }
    }

    getVillages(districtId)
      .then((items) => {
        if (isMounted) {
          setVillages(items)
          setLoadError("")
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Data desa/kelurahan belum bisa dimuat.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [districtId])

  const updateAddressField = (field: keyof UserProfileInput, nextValue: string) => {
    onChange(field, nextValue as never)
  }

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-brand-surface p-4">
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {loadError}
        </div>
      )}

      <Field>
        <FieldLabel htmlFor={`${kind}-street`}>Jalan</FieldLabel>
        <Input
          id={`${kind}-street`}
          value={String(value[fields.street] ?? "")}
          onChange={(event) => updateAddressField(fields.street, event.target.value)}
          placeholder="Nama jalan, nomor rumah, RT/RW"
          disabled={disabled}
          required={!disabled}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Nama Provinsi</FieldLabel>
          <Select
            value={String(value[fields.provinceId] ?? "")}
            onValueChange={(nextValue) => {
              updateAddressField(fields.provinceId, nextValue)
              updateAddressField(fields.provinceName, findRegionName(provinces, nextValue))
              updateAddressField(fields.regencyId, "")
              updateAddressField(fields.regencyName, "")
              updateAddressField(fields.districtId, "")
              updateAddressField(fields.districtName, "")
              updateAddressField(fields.villageId, "")
              updateAddressField(fields.villageName, "")
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih provinsi" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Nama Kabupaten / Kota</FieldLabel>
          <Select
            value={String(value[fields.regencyId] ?? "")}
            onValueChange={(nextValue) => {
              updateAddressField(fields.regencyId, nextValue)
              updateAddressField(fields.regencyName, findRegionName(regencies, nextValue))
              updateAddressField(fields.districtId, "")
              updateAddressField(fields.districtName, "")
              updateAddressField(fields.villageId, "")
              updateAddressField(fields.villageName, "")
            }}
            disabled={disabled || !provinceId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kabupaten/kota" />
            </SelectTrigger>
            <SelectContent>
              {regencies.map((regency) => (
                <SelectItem key={regency.id} value={regency.id}>
                  {regency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Nama Kecamatan</FieldLabel>
          <Select
            value={String(value[fields.districtId] ?? "")}
            onValueChange={(nextValue) => {
              updateAddressField(fields.districtId, nextValue)
              updateAddressField(fields.districtName, findRegionName(districts, nextValue))
              updateAddressField(fields.villageId, "")
              updateAddressField(fields.villageName, "")
            }}
            disabled={disabled || !regencyId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kecamatan" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Nama Desa / Kelurahan</FieldLabel>
          <Select
            value={String(value[fields.villageId] ?? "")}
            onValueChange={(nextValue) => {
              updateAddressField(fields.villageId, nextValue)
              updateAddressField(fields.villageName, findRegionName(villages, nextValue))
            }}
            disabled={disabled || !districtId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih desa/kelurahan" />
            </SelectTrigger>
            <SelectContent>
              {villages.map((village) => (
                <SelectItem key={village.id} value={village.id}>
                  {village.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}

export function ProfileForm({ value, isSubmitting, submitLabel, onChange, onSubmit }: ProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepError, setStepError] = useState("")
  const isLastStep = currentStep === steps.length - 1

  useEffect(() => {
    void getProvinces().catch(() => undefined)
  }, [])

  const goToNextStep = () => {
    if (!isStepComplete(value, currentStep)) {
      setStepError("Lengkapi semua field di step ini dulu ya.")
      return
    }

    setStepError("")
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  const goToPreviousStep = () => {
    setStepError("")
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handlePhoneCountryCodeChange = (nextCountryCode: string) => {
    const phoneCountryCode = normalizePhoneCountryCode(nextCountryCode)
    onChange("phoneCountryCode", phoneCountryCode)
    onChange("phoneNumber", composePhoneNumber(phoneCountryCode, value.phoneNationalNumber))
  }

  const handlePhoneNationalNumberChange = (nextNationalNumber: string) => {
    const phoneNationalNumber = normalizePhoneNationalNumber(nextNationalNumber)
    onChange("phoneNationalNumber", phoneNationalNumber)
    onChange("phoneNumber", composePhoneNumber(value.phoneCountryCode, phoneNationalNumber))
  }

  const handleSaveProfile = () => {
    if (!isLastStep || isSubmitting) {
      return
    }

    if (!isStepComplete(value, currentStep)) {
      setStepError("Lengkapi semua field di step ini dulu ya.")
      return
    }

    if (!steps.every((_, stepIndex) => isStepComplete(value, stepIndex))) {
      setStepError("Masih ada data yang belum lengkap.")
      return
    }

    setStepError("")
    onSubmit(value)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-9 items-center justify-center rounded-md bg-brand-mint text-primary">
          <UserRound className="size-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Lengkapi Profil</h1>
        <FieldDescription>
          Step {currentStep + 1} dari {steps.length}: {steps[currentStep].title}
        </FieldDescription>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => {
              if (index <= currentStep) {
                setStepError("")
                setCurrentStep(index)
              }
            }}
            className={cn(
              "h-2 rounded-full transition",
              index <= currentStep ? "bg-primary" : "bg-primary/15",
            )}
            aria-label={`Ke ${step.title}`}
          />
        ))}
      </div>

      <form onSubmit={handleFormSubmit}>
        <FieldGroup>
          <div className="text-center">
            <h2 className="text-base font-bold text-foreground">{steps[currentStep].title}</h2>
            <FieldDescription>{steps[currentStep].description}</FieldDescription>
          </div>

          {stepError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {stepError}
            </div>
          )}

          {currentStep === 0 && (
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="fullName">Nama Lengkap</FieldLabel>
                <Input
                  id="fullName"
                  value={value.fullName}
                  onChange={(event) => onChange("fullName", event.target.value)}
                  placeholder="Nama sesuai identitas"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="nickname">Nama Panggilan</FieldLabel>
                <Input
                  id="nickname"
                  value={value.nickname}
                  onChange={(event) => onChange("nickname", event.target.value)}
                  placeholder="Nama yang biasa dipakai"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="phoneNationalNumber">Nomor Telepon</FieldLabel>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <Input
                    id="phoneCountryCode"
                    type="tel"
                    value={value.phoneCountryCode}
                    onChange={(event) => handlePhoneCountryCodeChange(event.target.value)}
                    placeholder="+62"
                    aria-label="Kode negara"
                    required
                  />
                  <Input
                    id="phoneNationalNumber"
                    type="tel"
                    value={value.phoneNationalNumber}
                    onChange={(event) => handlePhoneNationalNumberChange(event.target.value)}
                    placeholder="89545672234"
                    required
                  />
                </div>
                <FieldDescription>
                  Tulis kode negara seperti +62, lalu nomor tanpa 0 di depan.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={value.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </Field>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="birthDate">Tanggal Lahir</FieldLabel>
                <Input
                  id="birthDate"
                  type="date"
                  value={value.birthDate}
                  onChange={(event) => onChange("birthDate", event.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="birthPlace">Tempat Lahir</FieldLabel>
                <Input
                  id="birthPlace"
                  value={value.birthPlace}
                  onChange={(event) => onChange("birthPlace", event.target.value)}
                  placeholder="Kota kelahiran"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="lastEducation">Pendidikan Terakhir</FieldLabel>
                <Input
                  id="lastEducation"
                  value={value.lastEducation}
                  onChange={(event) => onChange("lastEducation", event.target.value)}
                  placeholder="SMA, S1, S2, atau lainnya"
                  required
                />
              </Field>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid gap-4">
              <AddressSelector title="Alamat KTP" value={value} kind="ktp" onChange={onChange} />

              <div className="flex items-start gap-3 rounded-lg border border-border bg-white p-4">
                <Checkbox
                  id="domicileSameAsKtp"
                  checked={value.domicileSameAsKtp}
                  onCheckedChange={(checked) => onChange("domicileSameAsKtp", checked === true)}
                  className="mt-0.5"
                />
                <div>
                  <FieldLabel htmlFor="domicileSameAsKtp">Alamat domisili sama dengan KTP</FieldLabel>
                  <FieldDescription>
                    Centang jika alamat tinggal saat ini sama dengan alamat KTP.
                  </FieldDescription>
                </div>
              </div>

              {!value.domicileSameAsKtp && (
                <AddressSelector title="Alamat Domisili" value={value} kind="domicile" onChange={onChange} />
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
                Back
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSaveProfile}
                className={currentStep === 0 ? "sm:col-span-2" : ""}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner /> : <Save className="size-4" />}
                {submitLabel}
              </Button>
            ) : (
              <Button type="button" className={currentStep === 0 ? "sm:col-span-2" : ""} onClick={goToNextStep}>
                Next
              </Button>
            )}
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
