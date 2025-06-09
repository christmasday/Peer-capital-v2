"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { executeSql } from "@/lib/actions/execute-migration"

export function CreatePasswordResetTokensTableButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      // SQL to create the password_reset_tokens table
      const sql = `
        -- Create password_reset_tokens table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON public.password_reset_tokens(email);
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

        -- Add RLS policies
        ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Admins can do anything" ON public.password_reset_tokens;
        
        -- Create new policies
        CREATE POLICY "Admins can do anything" 
        ON public.password_reset_tokens 
        USING (
          (SELECT is_admin FROM auth_users WHERE id = auth.uid())
        );
      `

      const result = await executeSql(sql)

      if (result.success) {
        toast({
          title: "Success",
          description: "Password reset tokens table created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create password reset tokens table",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} className="w-full">
      {isLoading ? "Creating..." : "Create Password Reset Tokens Table"}
    </Button>
  )
}
