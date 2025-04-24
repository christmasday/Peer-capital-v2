-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);

-- Create a more specific function that avoids ambiguous column references
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table_name text,
  p_column_name text,
  p_column_type text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_type);
  END IF;
END;
$$ LANGUAGE plpgsql;
