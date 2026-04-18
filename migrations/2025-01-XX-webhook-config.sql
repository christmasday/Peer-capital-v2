-- Create webhook_config table
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_config_created_by ON webhook_config(created_by);
CREATE INDEX IF NOT EXISTS idx_webhook_config_enabled ON webhook_config(enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_config_created_at ON webhook_config(created_at);

-- Enable RLS
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view webhook config" ON webhook_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can insert webhook config" ON webhook_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can update webhook config" ON webhook_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

CREATE POLICY "Admins can delete webhook config" ON webhook_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_staff = true
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_config_updated_at
    BEFORE UPDATE ON webhook_config
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_config_updated_at();
