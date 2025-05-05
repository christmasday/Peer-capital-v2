-- Check if the webhook_events table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'webhook_events') THEN
    -- Create the webhook_events table
    CREATE TABLE public.webhook_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      processed BOOLEAN NOT NULL DEFAULT false,
      processing_error TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE
    );

    -- Add indexes for better performance
    CREATE INDEX webhook_events_event_type_idx ON public.webhook_events(event_type);
    CREATE INDEX webhook_events_created_at_idx ON public.webhook_events(created_at);
    CREATE INDEX webhook_events_processed_idx ON public.webhook_events(processed);

    -- Add RLS policies
    ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

    -- Policy for service role to manage all webhook events
    CREATE POLICY webhook_events_service_policy ON public.webhook_events
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
