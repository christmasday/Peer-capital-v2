-- Check if notification_preferences table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  transaction_alerts BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add email_notifications column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'email_notifications') THEN
    ALTER TABLE notification_preferences ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add sms_notifications column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'sms_notifications') THEN
    ALTER TABLE notification_preferences ADD COLUMN sms_notifications BOOLEAN DEFAULT FALSE;
  END IF;

  -- Check and add push_notifications column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'push_notifications') THEN
    ALTER TABLE notification_preferences ADD COLUMN push_notifications BOOLEAN DEFAULT FALSE;
  END IF;

  -- Check and add marketing_emails column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'marketing_emails') THEN
    ALTER TABLE notification_preferences ADD COLUMN marketing_emails BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add transaction_alerts column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'transaction_alerts') THEN
    ALTER TABLE notification_preferences ADD COLUMN transaction_alerts BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add security_alerts column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'security_alerts') THEN
    ALTER TABLE notification_preferences ADD COLUMN security_alerts BOOLEAN DEFAULT TRUE;
  END IF;
END $$;
