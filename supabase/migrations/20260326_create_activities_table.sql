-- 1. Create Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'upload', 'update', 'delete', 'match'
  entity_type TEXT NOT NULL, -- 'property', 'client', 'match'
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Agency Activity View"
ON activities FOR SELECT
TO authenticated
USING ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Agency Activity Insert"
ON activities FOR INSERT
TO authenticated
WITH CHECK ( agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) );

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_agency_id ON activities(agency_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
