-- Setup Password Management for OAuth Users
-- Run this in your Supabase SQL Editor

-- Create a function to check if user has a password set
CREATE OR REPLACE FUNCTION public.user_has_password(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has a password by looking at their auth method
  -- OAuth users typically don't have encrypted_password set
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND encrypted_password IS NOT NULL 
    AND encrypted_password != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user auth provider info
CREATE OR REPLACE FUNCTION public.get_user_auth_provider(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_data JSON;
BEGIN
  SELECT json_build_object(
    'provider', app_metadata->>'provider',
    'providers', app_metadata->'providers',
    'has_password', encrypted_password IS NOT NULL AND encrypted_password != ''
  ) INTO user_data
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is OAuth-only
CREATE OR REPLACE FUNCTION public.is_oauth_only_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_provider TEXT;
  has_password BOOLEAN;
BEGIN
  SELECT 
    app_metadata->>'provider' INTO user_provider,
    (encrypted_password IS NOT NULL AND encrypted_password != '') INTO has_password
  FROM auth.users 
  WHERE id = user_id;
  
  -- User is OAuth-only if they have a provider but no password
  RETURN user_provider IS NOT NULL AND NOT has_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user authentication status
CREATE OR REPLACE FUNCTION public.get_user_auth_status(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', id,
    'email', email,
    'provider', app_metadata->>'provider',
    'has_password', (encrypted_password IS NOT NULL AND encrypted_password != ''),
    'is_oauth_only', CASE 
      WHEN app_metadata->>'provider' IS NOT NULL 
      AND (encrypted_password IS NULL OR encrypted_password = '') 
      THEN true 
      ELSE false 
    END,
    'email_confirmed', email_confirmed_at IS NOT NULL,
    'created_at', created_at,
    'last_sign_in', last_sign_in_at
  ) INTO result
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to log password updates (optional, for audit purposes)
CREATE TABLE IF NOT EXISTS public.password_update_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on password_update_log
ALTER TABLE public.password_update_log ENABLE ROW LEVEL SECURITY;

-- Create policies for password_update_log
CREATE POLICY "Users can view their own password update logs" ON public.password_update_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own password update logs" ON public.password_update_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.user_has_password(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_auth_provider(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_oauth_only_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_auth_status(UUID) TO authenticated;

-- Grant permissions on password_update_log table
GRANT SELECT, INSERT ON public.password_update_log TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_update_log_user_id ON public.password_update_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_update_log_updated_at ON public.password_update_log(updated_at);

-- Create a view for easy access to user auth info (optional)
CREATE OR REPLACE VIEW public.user_auth_info AS
SELECT 
  id as user_id,
  email,
  app_metadata->>'provider' as auth_provider,
  (encrypted_password IS NOT NULL AND encrypted_password != '') as has_password,
  CASE 
    WHEN app_metadata->>'provider' IS NOT NULL 
    AND (encrypted_password IS NULL OR encrypted_password = '') 
    THEN true 
    ELSE false 
  END as is_oauth_only,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  last_sign_in_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_auth_info TO authenticated;

-- Add RLS policy for the view
CREATE POLICY "Users can view their own auth info" ON public.user_auth_info
  FOR SELECT USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON FUNCTION public.user_has_password(UUID) IS 'Check if a user has a password set';
COMMENT ON FUNCTION public.get_user_auth_provider(UUID) IS 'Get user authentication provider information';
COMMENT ON FUNCTION public.is_oauth_only_user(UUID) IS 'Check if user is OAuth-only (no password set)';
COMMENT ON FUNCTION public.get_user_auth_status(UUID) IS 'Get comprehensive user authentication status';
COMMENT ON TABLE public.password_update_log IS 'Audit log for password updates'; 