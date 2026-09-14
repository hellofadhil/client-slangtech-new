"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BookOpenCheck, CheckCircle2, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getValidSession } from "@/features/auth/services/firebase-auth"
import {
  getExistingActiveClassEnrollment,
  type ClassEnrollment,
} from "@/features/enrollments/services/enrollments"
import type { Class } from "@/features/classes/services/classes"

type ClassDetailActionsProps = {
  classItem: Class
  registerPath: string
}

export function ClassDetailActions({ classItem, registerPath }: ClassDetailActionsProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [existingEnrollment, setExistingEnrollment] = useState<ClassEnrollment | null>(null)

  useEffect(() => {
    let isMounted = true

    async function checkClassEnrollment() {
      const session = await getValidSession().catch(() => null)

      if (!isMounted) {
        return
      }

      if (!session) {
        setIsChecking(false)
        return
      }

      const activeEnrollment = await getExistingActiveClassEnrollment(session, classItem).catch(() => null)

      if (!isMounted) {
        return
      }

      setExistingEnrollment(activeEnrollment)
      setIsChecking(false)
    }

    checkClassEnrollment()

    return () => {
      isMounted = false
    }
  }, [classItem])

  if (existingEnrollment) {
    return (
      <div className="grid gap-3 md:w-[220px]">
        <Button type="button" size="lg" disabled className="w-full">
          <CheckCircle2 className="size-4" />
          Sudah Terdaftar
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/home">
            <LayoutDashboard className="size-4" />
            Lihat Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:w-[220px]">
      {isChecking ? (
        <Button type="button" size="lg" className="w-full" disabled>
          <BookOpenCheck className="size-4" />
          Mengecek...
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href={registerPath}>
            <BookOpenCheck className="size-4" />
            Daftar Kelas
          </Link>
        </Button>
      )}
    </div>
  )
}
