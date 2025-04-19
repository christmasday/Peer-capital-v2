"use client"

import { useSupabase } from "@/hooks/use-supabase"

export function AuthStatus() {
  const { session, loading } = useSupabase()

  if (loading) {
    return <div>Loading...</div>
  }

  return <div>{session ? <div>Logged in as: {session.user.email}</div> : <div>Not logged in</div>}</div>
}
