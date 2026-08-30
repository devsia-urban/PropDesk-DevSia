-- Phase 2: Performance Optimization Indexes
-- This migration enables pg_trgm for partial text matching and adds indexes to critical search columns.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Clients Table Indexes
-- B-tree for filtering
CREATE INDEX IF NOT EXISTS idx_clients_agency_deleted ON clients(agency_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- GIN with pg_trgm for partial text search (ilike)
CREATE INDEX IF NOT EXISTS idx_clients_full_name_trgm ON clients USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON clients USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_email_trgm ON clients USING gin (email gin_trgm_ops);

-- GIN for array overlaps
CREATE INDEX IF NOT EXISTS idx_clients_property_types_gin ON clients USING gin (property_types);


-- 2. Properties Table Indexes
-- B-tree for filtering
CREATE INDEX IF NOT EXISTS idx_properties_agency_deleted ON properties(agency_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);

-- GIN with pg_trgm for partial text search (ilike)
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_locality_trgm ON properties USING gin (locality gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON properties USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_description_trgm ON properties USING gin (description gin_trgm_ops);


-- 3. Brokers Table Indexes
-- B-tree for filtering
CREATE INDEX IF NOT EXISTS idx_brokers_agency_deleted ON brokers(agency_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_brokers_type ON brokers(broker_type);

-- GIN with pg_trgm for partial text search (ilike)
CREATE INDEX IF NOT EXISTS idx_brokers_full_name_trgm ON brokers USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brokers_company_trgm ON brokers USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brokers_area_trgm ON brokers USING gin (area gin_trgm_ops);

-- GIN for array overlap (specialties)
CREATE INDEX IF NOT EXISTS idx_brokers_specialties_gin ON brokers USING gin (specialties);
