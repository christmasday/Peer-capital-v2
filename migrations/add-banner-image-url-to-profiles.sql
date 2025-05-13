-- Check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'banner_image_url'
    ) THEN
        -- Add the banner_image_url column
        ALTER TABLE profiles
        ADD COLUMN banner_image_url TEXT;
    END IF;
END $$;
