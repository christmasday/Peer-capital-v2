-- Create a function to automatically create notification preferences when a new user is created
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default notification preferences for the new user
  INSERT INTO notification_preferences (
    user_id,
    email_notifications,
    sms_notifications,
    push_notifications,
    marketing_emails,
    transaction_alerts,
    security_alerts,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    TRUE,  -- email_notifications
    FALSE, -- sms_notifications
    FALSE, -- push_notifications
    TRUE,  -- marketing_emails
    TRUE,  -- transaction_alerts
    TRUE,  -- security_alerts
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists and drop it if it does
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth_users;

-- Create the trigger on the auth_users table
CREATE TRIGGER create_notification_preferences_trigger
AFTER INSERT ON auth_users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences();
