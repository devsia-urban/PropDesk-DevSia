-- FIX PROPERTIES RLS POLICIES
-- This script ensures that updates (including soft-delete) can be performed 
-- even when the resulting row would be hidden from SELECT queries.

-- 1. Drop existing update policies
DROP POLICY IF EXISTS "properties_update" ON properties;
DROP POLICY IF EXISTS "properties_delete" ON properties;

-- 2. Re-create "properties_update"
-- USERS: Agents and Admins in the same agency
-- USING: Can find rows that are currently NOT deleted and belong to their agency
-- WITH CHECK: Can save changes as long as agency_id remains theirs
CREATE POLICY "properties_update" ON properties 
FOR UPDATE 
USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'))
WITH CHECK (agency_id = my_agency_id());

-- 3. Re-create "properties_delete" (actually just another update policy for admins)
-- This allows admins to specifically manage properties (including potentially restoring them)
CREATE POLICY "properties_delete" ON properties 
FOR UPDATE 
USING (agency_id = my_agency_id() AND my_role() = 'admin')
WITH CHECK (agency_id = my_agency_id());

-- 4. Ensure SELECT policy is still correct but doesn't block updates
-- SELECT check remains: only show non-deleted rows to users
DROP POLICY IF EXISTS "properties_select" ON properties;
CREATE POLICY "properties_select" ON properties 
FOR SELECT
USING (agency_id = my_agency_id() AND is_deleted = FALSE);
