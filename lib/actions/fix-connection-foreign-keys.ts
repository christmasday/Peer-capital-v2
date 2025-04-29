"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function fixConnectionForeignKeys() {
  try {
    const adminClient = createAdminClient()

    // SQL to fix the foreign key constraints
    const sql = `
      -- Drop the existing foreign key constraints
      ALTER TABLE IF EXISTS public.user_connections 
        DROP CONSTRAINT IF EXISTS user_connections_follower_id_fkey,
        DROP CONSTRAINT IF EXISTS user_connections_following_id_fkey;

      -- Add new foreign key constraints referencing profiles table instead
      ALTER TABLE public.user_connections
        ADD CONSTRAINT user_connections_follower_id_fkey 
        FOREIGN KEY (follower_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;

      ALTER TABLE public.user_connections
        ADD CONSTRAINT user_connections_following_id_fkey 
        FOREIGN KEY (following_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    `

    const { error } = await adminClient.rpc("execute_sql", { sql_query: sql })

    if (error) {
      console.error("Error fixing connection foreign keys:", error)
      return { error: "Failed to fix connection foreign keys" }
    }

    // Revalidate admin pages
    revalidatePath("/admin/migrations")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error fixing connection foreign keys:", error)
    return { error: "An unexpected error occurred" }
  }
}
