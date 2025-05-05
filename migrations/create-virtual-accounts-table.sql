-- Check if the table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'virtual_accounts') THEN
        -- Create the virtual_accounts table
        CREATE TABLE public.virtual_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            account_number VARCHAR(255) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            bank_name VARCHAR(255) NOT NULL,
            bank_code VARCHAR(255) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
            assigned BOOLEAN NOT NULL DEFAULT true,
            paystack_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(user_id),
            UNIQUE(account_number)
        );

        -- Add RLS policies
        ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

        -- Policy for users to view their own virtual accounts
        CREATE POLICY "Users can view their own virtual accounts"
            ON public.virtual_accounts
            FOR SELECT
            USING (auth.uid() = user_id);

        -- Policy for service role to manage all virtual accounts
        CREATE POLICY "Service role can manage all virtual accounts"
            ON public.virtual_accounts
            USING (auth.role() = 'service_role');

        -- Add comment
        COMMENT ON TABLE public.virtual_accounts IS 'Stores dedicated virtual account details for users';
    END IF;
END
$$;
