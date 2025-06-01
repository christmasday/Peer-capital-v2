"use client"

import { useSupabaseClient } from "@/components/supabase/SupabaseProvider"

export function AuthStatus() {
  const { session } = useSupabaseClient()

  return <div>{session ? <div>Logged in as: {session.user.email}</div> : <div>Not logged in</div>}</div>
}
