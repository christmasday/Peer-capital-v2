-- Create messages table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add indexes for better performance
    CONSTRAINT messages_sender_recipient_idx UNIQUE (sender_id, recipient_id, created_at)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY messages_insert_policy ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_select_policy ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY messages_update_policy ON public.messages
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_updated_at();

-- Create function to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for the recipient
    INSERT INTO public.notifications (
        id,
        user_id,
        type,
        actor_id,
        reference_id,
        content,
        is_read,
        created_at,
        data
    ) VALUES (
        uuid_generate_v4(),
        NEW.recipient_id,
        'message',
        NEW.sender_id,
        NEW.id,
        'You have a new message',
        FALSE,
        NOW(),
        json_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id, 'preview', substring(NEW.content, 1, 50))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create notification when message is sent
CREATE TRIGGER create_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();
