import { randomBytes } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

const USERNAME_PREFIX = "u_"
const USERNAME_LENGTH = 10

function createUsernameCandidate() {
  const randomSegment = randomBytes(8).toString("hex").slice(0, USERNAME_LENGTH)
  return `${USERNAME_PREFIX}${randomSegment}`
}

export async function generateSystemUsername(adminClient: SupabaseClient<any, any, any>) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = createUsernameCandidate()
    const { data, error } = await adminClient.from("profiles").select("id").ilike("username", candidate).maybeSingle()

    if (!error && !data) {
      return candidate
    }
  }

  return `${USERNAME_PREFIX}${Date.now().toString(36)}`
}
