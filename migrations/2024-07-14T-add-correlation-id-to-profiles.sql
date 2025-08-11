-- Migration: Add correlation_id to profiles table
ALTER TABLE profiles ADD COLUMN correlation_id TEXT; 