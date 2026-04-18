-- Create virtual_accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  assigned BOOLEAN NOT NULL DEFAULT false,
  paystack_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_email ON virtual_accounts(email);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON virtual_accounts(account_number);

-- Create RLS policies
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own virtual accounts
CREATE POLICY "Users can view own virtual accounts" ON virtual_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own virtual accounts
CREATE POLICY "Users can insert own virtual accounts" ON virtual_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own virtual accounts
CREATE POLICY "Users can update own virtual accounts" ON virtual_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Staff can view all virtual accounts
CREATE POLICY "Staff can view all virtual accounts" ON virtual_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_type IN ('admin', 'support')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_virtual_accounts_updated_at 
  BEFORE UPDATE ON virtual_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
