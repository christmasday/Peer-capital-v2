import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: string | null
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function compact(value: string, maxLength: number) {
  const normalized = slugify(value)
  if (!normalized) {
    return ''
  }
  return normalized.length > maxLength ? normalized.slice(0, maxLength).replace(/-+$/g, '') : normalized
}

function deriveBaseUsername(profile: ProfileRow) {
  const nameParts = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  const emailLocalPart = profile.email?.split('@')[0] || ''
  const source = nameParts || emailLocalPart || `user-${profile.id.slice(0, 8)}`
  const base = compact(source, 24)
  return base || `user-${profile.id.slice(0, 8)}`
}

function pickUniqueUsername(base: string, taken: Set<string>, suffixHint: string) {
  const normalizedBase = compact(base, 24) || `user-${suffixHint}`
  let candidate = normalizedBase
  let attempt = 0

  while (taken.has(candidate)) {
    const suffix = attempt === 0 ? suffixHint : `${suffixHint}-${attempt}`
    const availableBase = normalizedBase.slice(0, Math.max(1, 28 - suffix.length - 1)).replace(/-+$/g, '')
    candidate = `${availableBase}-${suffix}`
    attempt += 1
  }

  taken.add(candidate)
  return candidate
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const dryRun = process.argv.includes('--dry-run')
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, email, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load profiles: ${error.message}`)
  }

  const rows = (profiles || []) as ProfileRow[]
  const taken = new Set<string>()
  const updates: Array<{ id: string; username: string }> = []

  for (const profile of rows) {
    if (profile.username) {
      taken.add(profile.username.trim().toLowerCase())
    }
  }

  for (const profile of rows) {
    const currentUsername = profile.username?.trim().toLowerCase() || ''
    const base = currentUsername || deriveBaseUsername(profile)
    const desiredUsername = pickUniqueUsername(base, taken, profile.id.slice(0, 8))

    if (currentUsername !== desiredUsername) {
      updates.push({ id: profile.id, username: desiredUsername })
    }
  }

  console.log(`Found ${rows.length} profiles`)
  console.log(`Preparing ${updates.length} username updates${dryRun ? ' (dry run)' : ''}`)

  if (dryRun) {
    for (const update of updates.slice(0, 20)) {
      console.log(`${update.id}: ${update.username}`)
    }
    if (updates.length > 20) {
      console.log(`...and ${updates.length - 20} more`)
    }
    return
  }

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: update.username, updated_at: new Date().toISOString() })
      .eq('id', update.id)

    if (updateError) {
      throw new Error(`Failed to update profile ${update.id}: ${updateError.message}`)
    }

    console.log(`Updated ${update.id} -> @${update.username}`)
  }

  console.log('Username backfill completed successfully')
}

main().catch((error) => {
  console.error('Username backfill failed:', error)
  process.exit(1)
})
