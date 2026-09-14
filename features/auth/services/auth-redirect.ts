export function getSafeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  return value
}

export function getReturnToFromLocation() {
  if (typeof window === "undefined") {
    return null
  }

  return getSafeReturnTo(new URLSearchParams(window.location.search).get("returnTo"))
}

export function getCurrentPathAsReturnTo() {
  if (typeof window === "undefined") {
    return null
  }

  return getSafeReturnTo(`${window.location.pathname}${window.location.search}`)
}

export function createAuthRedirectPath(path: "/login" | "/register" | "/profile/setup", returnTo?: string | null) {
  const safeReturnTo = getSafeReturnTo(returnTo)

  if (!safeReturnTo) {
    return path
  }

  return `${path}?returnTo=${encodeURIComponent(safeReturnTo)}`
}
