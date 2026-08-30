-- ==============================================================
-- 🔒 CLIENT RLS POLICY UPDATE
-- Enables Agents and Admins to add/edit clients,
-- but restricts Agents to only view and update assigned clients.
-- ==============================================================

-- 1. Drop existing clients policies to avoid conflict
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;

-- 2. CREATE CLIENT SELECT POLICY
-- - Admins can select any active client in their agency.
-- - Agents can only select clients in their agency assigned to them.
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (
    agency_id = my_agency_id() 
    AND is_deleted = FALSE 
    AND (
      my_role() = 'admin' 
      OR assigned_to = auth.uid()
    )
  );

-- 3. CREATE CLIENT INSERT POLICY
-- - Both admins and agents can insert new clients/leads for their agency.
CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (
    agency_id = my_agency_id() 
    AND my_role() IN ('admin', 'agent')
  );

-- 4. CREATE CLIENT UPDATE POLICY
-- - Admins can update any client in their agency.
-- - Agents can only update clients in their agency assigned to them.
CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (
    agency_id = my_agency_id() 
    AND (
      my_role() = 'admin' 
      OR assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = my_agency_id() 
    AND (
      my_role() = 'admin' 
      OR assigned_to = auth.uid()
    )
  );
