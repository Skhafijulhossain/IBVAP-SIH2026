-- ==============================================================================
-- IBVAP — Intelligent Border Video Analytics Platform (SIH 2026)
-- Production Supabase Authentication & User Roles Migration
-- ==============================================================================

-- 1. Create Profiles Table referencing Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Analyst' CHECK (role IN ('Commander', 'Analyst', 'Admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Security Policies
-- Allow authenticated users to view all profiles in the defense grid (for operator roster)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow individual users to update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Allow profile creation for the service role or trigger
CREATE POLICY "Profiles can be inserted by owner or system trigger"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 4. Function to automatically create profile on auth.users Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_full_name TEXT;
    user_role TEXT;
BEGIN
    -- Extract full_name and role from signup raw_user_meta_data
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Defense Operator');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Analyst');

    -- Validate role constraint
    IF user_role NOT IN ('Commander', 'Analyst', 'Admin') THEN
        user_role := 'Analyst';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (NEW.id, user_full_name, user_role, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to execute handle_new_user on every new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant appropriate access permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
