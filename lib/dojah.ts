const DEFAULT_DOJAH_BASE_URL = "https://api.dojah.io"

export function getDojahBaseUrl() {
  return (process.env.DOJAH_BASE_URL || process.env.NEXT_PUBLIC_DOJAH_BASE_URL || DEFAULT_DOJAH_BASE_URL).replace(/\/$/, "")
}

export function getDojahSecretKey() {
  return process.env.DOJAH_SECRET_KEY || process.env.DOJAH_API_KEY || ""
}

export function getDojahApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getDojahBaseUrl()}${normalizedPath}`
}