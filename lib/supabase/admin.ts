import { createClient } from '@supabase/supabase-js'

/**
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use this in Server Actions or API routes after manual authorization checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Admin environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Pre-initialized Admin Client for easy use in Server Actions.
 * WARNING: Bypasses RLS.
 */
export const supabaseAdmin = createAdminClient()
