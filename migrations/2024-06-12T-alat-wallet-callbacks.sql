CREATE TABLE IF NOT EXISTS alat_wallet_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tracking_id TEXT,
  status TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alat_wallet_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alat_wallet_tracking_id TEXT; 