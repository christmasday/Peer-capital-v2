import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

async function createWalletAddressTable() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Missing Supabase environment variables')
      process.exit(1)
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Test if table already exists by trying to select from it
    const { data: existingData, error: selectError } = await supabase
      .from('wallet_address')
      .select('id')
      .limit(1)
    
    if (!selectError) {
      console.log('✅ wallet_address table already exists')
      return
    }
    
    console.log('⚠️  wallet_address table does not exist. Please create it manually in your Supabase dashboard.')
    console.log('📋 SQL to run in Supabase SQL Editor:')
    console.log(`
-- Create wallet_address table
CREATE TABLE IF NOT EXISTS wallet_address (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  request_id TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_address_user_id ON wallet_address(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_address_request_id ON wallet_address(request_id);
CREATE INDEX IF NOT EXISTS idx_wallet_address_account_number ON wallet_address(account_number);
CREATE INDEX IF NOT EXISTS idx_wallet_address_wallet_address ON wallet_address(wallet_address);

-- Enable RLS
ALTER TABLE wallet_address ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wallet address" ON wallet_address
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet address" ON wallet_address
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet address" ON wallet_address
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallet address" ON wallet_address
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_wallet_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_address_updated_at
    BEFORE UPDATE ON wallet_address
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_address_updated_at();
    `)
    
  } catch (error) {
    console.error('❌ Error checking wallet_address table:', error)
    process.exit(1)
  }
}

createWalletAddressTable()
