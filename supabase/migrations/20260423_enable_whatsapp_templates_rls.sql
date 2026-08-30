-- Fix Security Warning: Enable RLS on whatsapp_templates
-- Error: Policy Exists RLS Disabled (public.whatsapp_templates)

-- 1. Enable RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to ensure clean state
DROP POLICY IF EXISTS "templates_select" ON whatsapp_templates;
DROP POLICY IF EXISTS "templates_insert" ON whatsapp_templates;
DROP POLICY IF EXISTS "templates_update" ON whatsapp_templates;
DROP POLICY IF EXISTS "templates_delete" ON whatsapp_templates;

-- 3. Create Comprehensive RLS Policies
-- SELECT: Agency members can see their own templates
CREATE POLICY "templates_select" ON whatsapp_templates
  FOR SELECT
  TO authenticated
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- INSERT: Agency members can create new templates for their agency
CREATE POLICY "templates_insert" ON whatsapp_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- UPDATE: Agency members can update their own templates
CREATE POLICY "templates_update" ON whatsapp_templates
  FOR UPDATE
  TO authenticated
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- DELETE: Agency members can delete their own templates
CREATE POLICY "templates_delete" ON whatsapp_templates
  FOR DELETE
  TO authenticated
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));
