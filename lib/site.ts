export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (!envUrl) return "https://slangtech.asia"

  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`
}