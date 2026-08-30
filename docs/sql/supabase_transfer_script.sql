-- PROP DESK FULL DATABASE MIGRATION SCRIPT
-- Copy and paste this into the Supabase SQL Editor of your NEW project.

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABLES
-- ==========================================

-- 1. agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  rera_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN (
    'apartment','villa','independent_house','plot','commercial','farmhouse','penthouse'
  )),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available','reserved','sold','rented'
  )),
  price NUMERIC NOT NULL,
  price_negotiable BOOLEAN DEFAULT FALSE,
  maintenance_charge NUMERIC,
  address TEXT,
  city TEXT,
  locality TEXT,
  pincode TEXT,
  bhk INTEGER,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_sqft NUMERIC,
  area_unit TEXT DEFAULT 'sqft' CHECK (area_unit IN ('sqft', 'sqyard', 'sqm')),
  road_info TEXT,
  floor_number TEXT,
  total_floors TEXT,
  facing TEXT,
  furnishing TEXT CHECK (furnishing IN ('unfurnished','semi_furnished','fully_furnished')),
  parking TEXT,
  image_urls TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT CHECK (source IN (
    'walk_in','referral','social_media','property_portal','cold_call','other'
  )),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','matched','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  follow_up_date DATE,
  -- Requirements (used by match engine)
  looking_for TEXT CHECK (looking_for IN ('buy','rent')),
  property_types TEXT[] DEFAULT '{}',
  preferred_bhks INTEGER[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  budget_min NUMERIC,
  budget_max NUMERIC,
  min_bedrooms INTEGER DEFAULT 0,
  min_area_sqft NUMERIC,
  min_area_unit TEXT DEFAULT 'sqft' CHECK (min_area_unit IN ('sqft', 'sqyard', 'sqm')),
  furnishing_preference TEXT,
  possession_timeline TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_breakdown JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','contacted','dismissed')),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, property_id)
);

-- 6. notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_client','match_found','property_update','team_member','system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_properties_agency ON properties(agency_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_clients_agency ON clients(agency_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_matches_client ON matches(client_id);
CREATE INDEX IF NOT EXISTS idx_matches_property ON matches(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ==========================================
-- 4. FUNCTIONS & TRIGGERS
-- ==========================================

-- Updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    (NEW.raw_user_meta_data->>'agency_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN others THEN NULL; END $$;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get caller's agency_id
CREATE OR REPLACE FUNCTION my_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get caller's role
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- agencies: members can read their own agency, only admin can update
CREATE POLICY "agency_select" ON agencies FOR SELECT USING (id = my_agency_id());
CREATE POLICY "agency_update" ON agencies FOR UPDATE USING (id = my_agency_id() AND my_role() = 'admin');

-- profiles: team members can see each other, only admin can manage
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (agency_id = my_agency_id());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (agency_id = my_agency_id() AND my_role() = 'admin');
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (agency_id = my_agency_id() AND my_role() = 'admin');

-- properties: all team can read, agent/admin can write, only admin can delete (marked as deleted)
CREATE POLICY "properties_select" ON properties FOR SELECT USING (agency_id = my_agency_id() AND is_deleted = FALSE);
CREATE POLICY "properties_insert" ON properties FOR INSERT WITH CHECK (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));
CREATE POLICY "properties_update" ON properties FOR UPDATE USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));
CREATE POLICY "properties_delete" ON properties FOR UPDATE USING (agency_id = my_agency_id() AND my_role() = 'admin');

-- clients: same pattern as properties
CREATE POLICY "clients_select" ON clients FOR SELECT USING (agency_id = my_agency_id() AND is_deleted = FALSE);
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));

-- matches: all team can read
CREATE POLICY "matches_select" ON matches FOR SELECT USING (agency_id = my_agency_id());
CREATE POLICY "matches_update" ON matches FOR UPDATE USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));

-- notifications: each user sees only their own
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ==========================================
-- 6. STORAGE CONFIGURATION
-- ==========================================

-- Storage policies:
CREATE POLICY "images_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "images_select" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
