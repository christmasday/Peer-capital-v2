-- Create admin_config table for storing admin configuration values
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(config_key);

-- Enable RLS
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view config" ON admin_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can insert config" ON admin_config
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can update config" ON admin_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_staff = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_config_updated_at
    BEFORE UPDATE ON admin_config
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_config_updated_at();

