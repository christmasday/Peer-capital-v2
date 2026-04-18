-- Create admin_fees table for configurable fee percentages
CREATE TABLE IF NOT EXISTS admin_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL UNIQUE CHECK (fee_type IN ('lender_fee', 'borrower_fee')),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default fee values
INSERT INTO admin_fees (fee_type, percentage) VALUES 
  ('lender_fee', 1.50),
  ('borrower_fee', 1.50)
ON CONFLICT (fee_type) DO NOTHING;

-- Add RLS policies
ALTER TABLE admin_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view fees" ON admin_fees
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admin can update fees" ON admin_fees
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_staff = true
    )
  );

-- Add environment variable for admin wallet address
COMMENT ON TABLE admin_fees IS 'Store admin wallet address in ADMIN_WALLET_ADDRESS env var';
