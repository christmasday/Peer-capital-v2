-- Add address verification fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS address_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_verification_status TEXT,
  ADD COLUMN IF NOT EXISTS address_verification_reference_id TEXT;