-- ============================================================
-- SBR Monitor: Auth, OTP Password Reset, Default Password Flag
-- ============================================================

-- 1. TYPES
DROP TYPE IF EXISTS public.user_role_type CASCADE;
CREATE TYPE public.user_role_type AS ENUM ('admin', 'operator');

-- 2. CORE TABLES

-- User profiles (auto-created by trigger on auth.users insert)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.user_role_type NOT NULL DEFAULT 'operator',
  contact_number TEXT NOT NULL DEFAULT '',
  must_reset_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP reset codes table
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.password_reset_otps(expires_at);

-- 4. FUNCTIONS

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, contact_number, must_reset_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')::public.user_role_type,
    COALESCE(NEW.raw_user_meta_data->>'contact_number', ''),
    COALESCE((NEW.raw_user_meta_data->>'must_reset_password')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Admin check function (reads from auth metadata to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin')
  );
$$;

-- Generate and store OTP for password reset
CREATE OR REPLACE FUNCTION public.create_password_reset_otp(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp TEXT;
BEGIN
  -- Generate 6-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Invalidate previous unused OTPs for this email
  UPDATE public.password_reset_otps
  SET used = true
  WHERE email = p_email AND used = false;

  -- Insert new OTP (expires in 15 minutes)
  INSERT INTO public.password_reset_otps (email, otp_code, expires_at)
  VALUES (p_email, v_otp, now() + INTERVAL '15 minutes');

  RETURN v_otp;
END;
$$;

-- Verify OTP and return validity
CREATE OR REPLACE FUNCTION public.verify_password_reset_otp(p_email TEXT, p_otp TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN := false;
  v_otp_id UUID;
BEGIN
  SELECT id INTO v_otp_id
  FROM public.password_reset_otps
  WHERE email = p_email
    AND otp_code = p_otp
    AND used = false
    AND expires_at > now()
  LIMIT 1;

  IF v_otp_id IS NOT NULL THEN
    -- Mark as used
    UPDATE public.password_reset_otps SET used = true WHERE id = v_otp_id;
    v_valid := true;
  END IF;

  RETURN v_valid;
END;
$$;

-- 5. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- profiles: users manage own profile
DROP POLICY IF EXISTS "users_manage_own_profiles" ON public.profiles;
CREATE POLICY "users_manage_own_profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- profiles: admins can read all profiles
DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;
CREATE POLICY "admins_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- profiles: admins can insert profiles (for user management)
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.profiles;
CREATE POLICY "admins_insert_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- profiles: admins can update all profiles
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
CREATE POLICY "admins_update_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- profiles: admins can delete profiles
DROP POLICY IF EXISTS "admins_delete_profiles" ON public.profiles;
CREATE POLICY "admins_delete_profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- OTP table: open for anon (needed for forgot password before login)
DROP POLICY IF EXISTS "otp_open_access" ON public.password_reset_otps;
CREATE POLICY "otp_open_access"
ON public.password_reset_otps
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. MOCK DATA (Admin + Operator accounts)
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  operator_uuid UUID := gen_random_uuid();
BEGIN
  -- Admin account
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@sbr-monitor.ph', crypt('SBR_Admin#2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Engr. Reyes Santos', 'role', 'admin', 'contact_number', '+63 917 123 4567', 'must_reset_password', false),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  )
  ON CONFLICT (id) DO NOTHING;

  -- Operator account (default password sbrm2026 → must reset)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    operator_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'operator@sbr-monitor.ph', crypt('SBR_Ops#2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Juan dela Cruz', 'role', 'operator', 'contact_number', '+63 918 765 4321', 'must_reset_password', false),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  )
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
