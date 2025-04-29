-- Check if the notifications table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        -- Add missing columns if they don't exist
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'notifications' 
                          AND column_name = 'message') THEN
                ALTER TABLE public.notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error adding message column: %', SQLERRM;
        END;

        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'notifications' 
                          AND column_name = 'data') THEN
                ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error adding data column: %', SQLERRM;
        END;

        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'notifications' 
                          AND column_name = 'title') THEN
                ALTER TABLE public.notifications ADD COLUMN title TEXT NOT NULL DEFAULT '';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error adding title column: %', SQLERRM;
        END;
    ELSE
        -- Create the notifications table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT NULL,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

        -- Add RLS policies
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Policy to allow users to see only their own notifications
        CREATE POLICY notifications_select_policy ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);

        -- Policy to allow users to update only their own notifications (e.g., mark as read)
        CREATE POLICY notifications_update_policy ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);

        -- Policy to allow service role to manage all notifications
        CREATE POLICY notifications_service_policy ON public.notifications
            USING (auth.jwt() ->> 'role' = 'service_role');

        -- Add trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_notifications_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_notifications_timestamp
        BEFORE UPDATE ON public.notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_notifications_updated_at();
    END IF;
END $$;
