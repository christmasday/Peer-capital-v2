-- Migration: Add transaction_hash to transactions table
ALTER TABLE transactions ADD COLUMN transaction_hash TEXT; 