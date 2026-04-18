# Notification System Documentation

## Overview

The notification system sends email notifications to users when they have email notifications enabled, regardless of whether they are logged in or not. The system respects user notification preferences and provides different email content based on login status.

## Features

### 1. Session Tracking
- **Automatic Login/Logout Detection**: The system tracks when users log in and out
- **Activity Monitoring**: Tracks user activity to maintain session freshness
- **Session Expiration**: Sessions automatically expire after 24 hours of inactivity

### 2. Smart Notification Logic
- **Always Send**: Emails are sent whenever users have notifications enabled
- **Preference Respect**: Only sends notifications for enabled notification types
- **Activity Type Mapping**: Maps different activities to specific notification preferences
- **Login Status Awareness**: Customizes email content based on whether user is logged in

### 3. Notification Types

#### Account Activity
- **Login**: New login detected
- **Password Change**: Password successfully changed

#### Transaction Activity
- **Account Funding**: Account funded with money
- **Withdrawal**: Money withdrawn from account

#### Loan Activity
- **Loan Request**: New loan request submitted
- **Loan Repayment**: Loan repayment received

#### Security Activity
- **Security Alerts**: Security-related events
- **Verification**: Verification status updates

## Database Schema

### user_sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  user_agent TEXT,
  ip_address INET,
  UNIQUE(user_id, session_token)
);
```

### notification_preferences Table
The existing notification preferences table is used to control which notifications are sent.

## API Endpoints

### 1. Session Tracking
**POST** `/api/session/track`
```json
{
  "action": "login" | "logout" | "activity",
  "sessionToken": "string",
  "userAgent": "string",
  "ipAddress": "string"
}
```

### 2. Send Notifications
**POST** `/api/notifications/send`
```json
{
  "type": "login" | "password_change" | "account_funding" | "withdrawal" | "loan_request" | "loan_repayment" | "verification" | "security_alert",
  "userId": "string",
  "title": "string",
  "description": "string",
  "metadata": {}
}
```

## Usage Examples

### 1. Using Helper Functions
```typescript
import { notificationHelpers } from "@/lib/notification-utils"

// Send a login notification
await notificationHelpers.login(userId, {
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0..."
})

// Send a password change notification
await notificationHelpers.passwordChange(userId, {
  ip_address: "192.168.1.1"
})

// Send an account funding notification
await notificationHelpers.accountFunding(userId, "₦50,000", {
  reference: "TXN123456"
})
```

### 2. Direct API Call
```typescript
import { sendAccountNotification } from "@/lib/notification-utils"

await sendAccountNotification({
  type: 'security_alert',
  userId: 'user-id',
  title: 'Suspicious Activity Detected',
  description: 'We detected unusual activity on your account.',
  metadata: {
    ip_address: '192.168.1.1',
    location: 'Lagos, Nigeria'
  }
})
```

### 3. Server-Side Usage
```typescript
import { sendNotificationEmail } from "@/lib/notification-service"

await sendNotificationEmail({
  type: 'loan_request',
  userId: 'user-id',
  title: 'Loan Request Submitted',
  description: 'Your loan request has been submitted successfully.',
  metadata: {
    amount: '₦100,000',
    purpose: 'Business expansion'
  }
})
```

## Email Templates

### Account Activity Email
- **Visual Design**: Professional email template with PeerCapital branding
- **Event Icons**: Different icons for different event types
- **Color Coding**: Color-coded borders based on event type
- **Login Status Awareness**: Different notices based on whether user is logged in
- **Metadata Display**: Shows relevant event metadata

### Event Type Colors
- **Login/Logout**: Blue (#3b82f6)
- **Security**: Red (#ef4444)
- **Transactions**: Green (#10b981)
- **Loans**: Purple (#8b5cf6)
- **Verification**: Yellow (#f59e0b)

### Login Status Notices
- **When Logged In**: Blue notice explaining the notification was sent because email notifications are enabled
- **When Logged Out**: Yellow security notice explaining the notification was sent because the user was not logged in

## Integration Points

### 1. Password Change
The password change API automatically sends notifications when passwords are changed.

### 2. Session Tracking
The `SessionTracker` component automatically tracks user sessions and sends login/logout notifications.

### 3. Manual Integration
Use the helper functions or direct API calls to send notifications for custom events.

## Configuration

### Environment Variables
- `RESEND_API_KEY`: Required for sending emails
- `NEXT_PUBLIC_APP_URL`: Used in email templates for links

### Notification Preferences
Users can control their notification preferences in the Settings page:
- Email notifications (on/off)
- Activity-specific notifications (on/off)
- Global mute (disables all notifications)

## Security Features

### 1. Session Validation
- Sessions are validated on every request
- Expired sessions are automatically cleaned up
- IP addresses and user agents are tracked

### 2. Rate Limiting
- Built-in rate limiting to prevent spam
- Automatic cleanup of old sessions

### 3. Privacy Protection
- Respects user notification preferences
- No sensitive data in email content
- Login status awareness for appropriate messaging

## Testing

### 1. Manual Testing
1. Enable email notifications in settings
2. Trigger an event (e.g., change password, login, logout)
3. Check email for notification
4. Verify the notice matches your login status

### 2. Development Testing
```typescript
// Test notification sending
const success = await notificationHelpers.login('test-user-id', {
  ip_address: '127.0.0.1',
  user_agent: 'Test Browser'
})
console.log('Notification sent:', success)
```

## Troubleshooting

### Common Issues

1. **No emails received**
   - Verify email notifications are enabled in settings
   - Check RESEND_API_KEY environment variable
   - Check spam folder

2. **Session tracking issues**
   - Verify user_sessions table exists
   - Check database permissions
   - Review session cleanup logs

3. **Email delivery issues**
   - Check Resend dashboard for delivery status
   - Verify email template syntax
   - Check spam folder

### Logs
The system logs all notification attempts and failures for debugging:
- Successful email sends (with login status)
- Failed email sends (with reasons)
- Session tracking events
- User preference checks
