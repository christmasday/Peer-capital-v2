-- Check if the virtual_accounts table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'virtual_accounts') THEN
    -- Create the virtual_accounts table if it doesn't exist
    CREATE TABLE public.virtual_accounts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      bank_code TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      assigned BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'pending',
      paystack_id TEXT,
      failure_reason TEXT,
      assignment_details JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(user_id),
      UNIQUE(account_number)
    );

    -- Add RLS policies
    ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

    -- Policy for users to view their own virtual accounts
    CREATE POLICY virtual_accounts_select_policy ON public.virtual_accounts
      FOR SELECT USING (auth.uid() = user_id);

    -- Policy for service role to manage all virtual accounts
    CREATE POLICY virtual_accounts_service_policy ON public.virtual_accounts
      USING (true)
      WITH CHECK (true);
  ELSE
    -- Add new columns if they don't exist
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'virtual_accounts' AND column_name = 'status') THEN
        ALTER TABLE public.virtual_accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding status column: %', SQLERRM;
    END;

    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'virtual_accounts' AND column_name = 'failure_reason') THEN
        ALTER TABLE public.virtual_accounts ADD COLUMN failure_reason TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding failure_reason column: %', SQLERRM;
    END;

    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'virtual_accounts' AND column_name = 'assignment_details') THEN
        ALTER TABLE public.virtual_accounts ADD COLUMN assignment_details JSONB;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding assignment_details column: %', SQLERRM;
    END;
  END IF;
END
$$;
