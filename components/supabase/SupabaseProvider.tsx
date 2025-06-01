"use client"

import { createContext, useContext, useMemo, useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import type { Session } from "@supabase/supabase-js"

// Context type
type SupabaseContextType = {
  supabase: SupabaseClient<Database>
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabaseClient() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error("useSupabaseClient must be used within SupabaseProvider")
  return ctx
} 