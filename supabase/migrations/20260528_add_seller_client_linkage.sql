-- ==============================================================
-- 🔒 ADDITIVE MIGRATION: SELLER LEADS & PROPERTY LINKAGE
-- ⚠️ 100% SAFE: No data deletion, overwriting, or structural drops.
-- ==============================================================

-- 1. Safely alter clients 'looking_for' CHECK constraint
-- This drops the old ('buy','rent') check and expands it to ('buy','rent','sell')
ALTER TABLE public.clients 
  DROP CONSTRAINT IF EXISTS clients_looking_for_check;

ALTER TABLE public.clients 
  ADD CONSTRAINT clients_looking_for_check CHECK (looking_for IN ('buy','rent','sell'));

-- 2. Add 'seller_client_id' foreign key column to properties table
-- Defaults to NULL for all existing listings, ensuring absolutely zero data loss.
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS seller_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- 3. Create index for fast matching queries
CREATE INDEX IF NOT EXISTS idx_properties_seller_client_id 
  ON public.properties(seller_client_id);
