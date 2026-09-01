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

export async function updateAssociateStatus(id: string, status: 'approved' | 'rejected') {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')

  const supabase = await createClient()

  // 1. Update the application status
  const { data: application, error: updateError } = await supabase
    .from('associate_applications')
    .update({ status })
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .select()
    .single()

  if (updateError) throw new Error(\`Failed to update status: \${updateError.message}\`)

  // 2. If approved, optionally do something else (e.g. create a broker profile)
  // For now, we just update the status so the UI reflects it!

  return { success: true, application }
}
