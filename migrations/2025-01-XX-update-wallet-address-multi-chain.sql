-- Update wallet_address table to support multiple blockchain wallet addresses per user
-- This migration adds columns for each blockchain while keeping the original wallet_address column for backward compatibility

-- Add new columns for each blockchain
ALTER TABLE wallet_address 
ADD COLUMN IF NOT EXISTS base_address TEXT,
ADD COLUMN IF NOT EXISTS ethereum_address TEXT,
ADD COLUMN IF NOT EXISTS polygon_address TEXT,
ADD COLUMN IF NOT EXISTS bnb_address TEXT,
ADD COLUMN IF NOT EXISTS asset_chain_address TEXT,
ADD COLUMN IF NOT EXISTS bantu_address TEXT;

-- Drop the unique constraint on wallet_address column to allow multiple addresses per user
-- (The unique_user_wallet constraint already ensures one row per user)
ALTER TABLE wallet_address DROP CONSTRAINT IF EXISTS wallet_address_wallet_address_key;

-- Create indexes for the new blockchain address columns
CREATE INDEX IF NOT EXISTS idx_wallet_address_base ON wallet_address(base_address) WHERE base_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_address_ethereum ON wallet_address(ethereum_address) WHERE ethereum_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_address_polygon ON wallet_address(polygon_address) WHERE polygon_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_address_bnb ON wallet_address(bnb_address) WHERE bnb_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_address_asset_chain ON wallet_address(asset_chain_address) WHERE asset_chain_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_address_bantu ON wallet_address(bantu_address) WHERE bantu_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN wallet_address.base_address IS 'Base blockchain wallet address';
COMMENT ON COLUMN wallet_address.ethereum_address IS 'Ethereum blockchain wallet address';
COMMENT ON COLUMN wallet_address.polygon_address IS 'Polygon blockchain wallet address';
COMMENT ON COLUMN wallet_address.bnb_address IS 'BNB Chain wallet address';
COMMENT ON COLUMN wallet_address.asset_chain_address IS 'Asset Chain wallet address';
COMMENT ON COLUMN wallet_address.bantu_address IS 'Bantu blockchain wallet address';
