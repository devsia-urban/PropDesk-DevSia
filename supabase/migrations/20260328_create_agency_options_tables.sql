-- 1. Create Agency Amenities Table
CREATE TABLE IF NOT EXISTS agency_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)
);

-- 2. Create Agency Approval Types Table
CREATE TABLE IF NOT EXISTS agency_approval_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)
);

-- 3. Enable RLS
ALTER TABLE agency_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_approval_types ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Agency View Amenities" ON agency_amenities FOR SELECT TO authenticated USING ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );
CREATE POLICY "Agency Insert Amenities" ON agency_amenities FOR INSERT TO authenticated WITH CHECK ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Agency View Approval Types" ON agency_approval_types FOR SELECT TO authenticated USING ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );
CREATE POLICY "Agency Insert Approval Types" ON agency_approval_types FOR INSERT TO authenticated WITH CHECK ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_agency_amenities_agency_id ON agency_amenities(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_approval_types_agency_id ON agency_approval_types(agency_id);
