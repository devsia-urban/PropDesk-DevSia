-- Phase: Subscription Management System
-- This migration adds manual subscription tracking to agencies

-- 1. Add subscription columns to agencies
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'paused', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';

-- 2. Initialize existing agencies with a 14-day trial if they don't have an end date
UPDATE agencies 
SET 
  subscription_status = 'trial',
  subscription_end_date = created_at + INTERVAL '14 days'
WHERE subscription_end_date IS NULL;

-- 3. Update profiles table to reflect Super Admin (optional, but good for record)
-- We also handle super admin by email in the application code for security.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 4. Mark the developer as Super Admin
UPDATE profiles SET is_super_admin = TRUE WHERE email = 'typepilotkeyboard@gmail.com';
