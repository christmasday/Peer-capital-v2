-- Check if the notification_preferences table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_preferences'
  ) THEN
    -- Create the notification_preferences table if it doesn't exist
    CREATE TABLE public.notification_preferences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      email_notifications BOOLEAN DEFAULT TRUE,
      sms_notifications BOOLEAN DEFAULT FALSE,
      push_notifications BOOLEAN DEFAULT FALSE,
      marketing_emails BOOLEAN DEFAULT TRUE,
      transaction_alerts BOOLEAN DEFAULT TRUE,
      security_alerts BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END
$$;

-- Check if the foreign key constraint exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notification_preferences_user_id_fkey' 
    AND table_name = 'notification_preferences'
  ) THEN
    ALTER TABLE public.notification_preferences DROP CONSTRAINT notification_preferences_user_id_fkey;
  END IF;
END
$$;

-- Add the correct foreign key constraint
ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.auth_users(id)
ON DELETE CASCADE;

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
