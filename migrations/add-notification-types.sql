-- Add new notification types to support all activity types
DO $$
BEGIN
  -- Check if the notification_types table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_types'
  ) THEN
    -- Insert new notification types if they don't exist
    INSERT INTO notification_types (type, description)
    VALUES 
      ('deposit', 'Account deposit notifications'),
      ('withdrawal', 'Account withdrawal notifications'),
      ('virtual_account_created', 'Virtual account creation notifications'),
      ('virtual_account_funded', 'Virtual account funding notifications'),
      ('profile_updated', 'Profile update notifications'),
      ('verification_started', 'Verification started notifications'),
      ('verification_completed', 'Verification completed notifications'),
      ('account_created', 'Account creation notifications'),
      ('security_alert', 'Security alert notifications')
    ON CONFLICT (type) DO NOTHING;
  END IF;
END $$;
