-- Implementation of ON CONFLICT to handle re-invites and profile recovery
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_agency_id UUID;
  new_role TEXT;
BEGIN
  -- 1. Determine Agency ID
  -- Priority A: Use agency_id from user metadata (Official/Manual Invite)
  target_agency_id := (NEW.raw_user_meta_data->>'agency_id')::UUID;
  
  -- Priority B: Fallback to agency matching contact_email (Initial Magic Link)
  IF target_agency_id IS NULL THEN
    SELECT id INTO target_agency_id
    FROM agencies 
    WHERE contact_email = NEW.email
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE agency_id = agencies.id)
    LIMIT 1;
  END IF;

  -- 2. Determine Role
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- 3. Create or Update Profile
  -- We use ON CONFLICT (id) to handle cases where the user was previously registered
  -- but is now being re-invited or has a stale profile record.
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    agency_id,
    is_active,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    new_role,
    target_agency_id,
    TRUE,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    agency_id = COALESCE(EXCLUDED.agency_id, public.profiles.agency_id),
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
