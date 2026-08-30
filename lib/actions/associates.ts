'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export async function getAssociates() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('associate_applications')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAssociates error:', error)
    throw new Error(`Failed to fetch associates: ${error.message}`)
  }

  return data
}
