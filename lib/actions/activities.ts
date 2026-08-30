'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export interface Activity {
  id: string
  created_at: string
  user_id: string
  action: 'create' | 'update' | 'delete' | 'match' | 'view' | 'share' | 'assign' | 'call' | 'hold' | 'booked' | 'cancelled' | 'converted' | 'released'
  entity_type: 'property' | 'client' | 'match' | 'broker' | 'public_view' | 'unit'
  entity_id: string
  details: any
  profiles: {
    full_name: string
  }
}

export async function getRecentActivities(limit = 10): Promise<Activity[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select(`
      *,
      profiles:user_id(full_name)
    `)
    .eq('agency_id', profile.agency_id)

  // Agents see only their own activities, OR activities where they were assigned
  if (profile.role !== 'admin' && !profile.is_super_admin) {
    query = query.or(`user_id.eq.${profile.id},details->>assigned_to_id.eq.${profile.id}`)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('getRecentActivities error:', error)
    }
    return []
  }

  return data as unknown as Activity[]
}

/**
 * Generic activity logger for any module.
 */
export async function logActivity(data: {
  action: string
  entityType: string
  entityId: string
  details?: any
}) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      details: data.details || {},
    })

  if (error) {
    console.error('logActivity error:', error)
  }
}
export async function logPropertyShared(propertyId: string, propertyTitle: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'share',
      entity_type: 'property',
      entity_id: propertyId,
      details: { title: propertyTitle, medium: 'whatsapp_link' }
    })

  if (error) {
    console.error('logPropertyShared error:', error)
    return { error: error.message }
  }

  return { success: true }
}
