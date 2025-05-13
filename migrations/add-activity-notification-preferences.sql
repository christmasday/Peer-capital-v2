-- Add activity-specific notification columns to notification_preferences table
DO $$
BEGIN
  -- Check and add transaction_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'transaction_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN transaction_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add loan_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'loan_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN loan_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add connection_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'connection_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN connection_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add message_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'message_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN message_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add verification_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'verification_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN verification_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add account_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'account_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN account_activity BOOLEAN DEFAULT TRUE;
  END IF;

  -- Check and add system_activity column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' AND column_name = 'system_activity') THEN
    ALTER TABLE notification_preferences ADD COLUMN system_activity BOOLEAN DEFAULT TRUE;
  END IF;
END $$;
