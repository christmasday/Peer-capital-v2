-- Create ip_allowlist table
CREATE TABLE IF NOT EXISTS ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_ip_address ON ip_allowlist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_created_by ON ip_allowlist(created_by);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_created_at ON ip_allowlist(created_at);

-- Enable RLS
ALTER TABLE ip_allowlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all IP addresses" ON ip_allowlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can insert IP addresses" ON ip_allowlist
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can update IP addresses" ON ip_allowlist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can delete IP addresses" ON ip_allowlist
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ip_allowlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ip_allowlist_updated_at
    BEFORE UPDATE ON ip_allowlist
    FOR EACH ROW
    EXECUTE FUNCTION update_ip_allowlist_updated_at();
