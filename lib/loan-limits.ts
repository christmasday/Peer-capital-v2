// Utility: convert duration + unit to days (approx months = 30 days)
export function durationToDays(duration: number, unit: string) {
  if (!duration || duration <= 0) return 0
  const u = (unit || "months").toLowerCase()
  if (u === "days") return duration
  if (u === "weeks") return duration * 7
  // treat months as 30 days
  return duration * 30
}

