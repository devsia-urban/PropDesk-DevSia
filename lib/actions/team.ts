'use server'

import { requireProfile } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { UserRole, Profile } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getTeamMembers(page: number = 1) {
  const profile = await requireProfile()
  if (!profile.agency_id) return { data: [], count: 0 }

  const supabase = await createClient()
  const pageSize = 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) {
    console.error('getTeamMembers error:', error)
    throw new Error(`Failed to fetch team members: ${error.message}`)
  }
  
  return {
    data: data as Profile[],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function updateMemberRole(
  memberId: string,
  role: UserRole
): Promise<{ error?: string }> {
  const profile = await requireProfile()
  if (profile.role !== 'admin') return { error: 'Only admins can change roles' }
  if (memberId === profile.id) return { error: 'You cannot change your own role' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('agency_id', profile.agency_id!)

  if (error) return { error: error.message }
  revalidatePath('/team')
  return {}
}

export async function deactivateMember(memberId: string): Promise<{ error?: string }> {
  console.log(`[TEAM_DEBUG] Deactivating member: ${memberId}`)
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    console.error(`[TEAM_DEBUG] Unauthorized: ${profile.full_name} (${profile.role}) tried to deactivate.`)
    return { error: 'Only admins can deactivate members' }
  }
  if (memberId === profile.id) return { error: 'You cannot deactivate yourself' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('agency_id', profile.agency_id!)

  if (error) {
    console.error(`[TEAM_DEBUG] DB Error deactivating:`, error.message)
    return { error: error.message }
  }
  console.log(`[TEAM_DEBUG] Success: Member ${memberId} deactivated.`)
  revalidatePath('/team')
  return {}
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  console.log(`[TEAM_DEBUG] Removing member: ${memberId}`)
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    console.error(`[TEAM_DEBUG] Unauthorized: ${profile.full_name} (${profile.role}) tried to remove.`)
    return { error: 'Only admins can remove members' }
  }
  if (memberId === profile.id) return { error: 'You cannot remove yourself' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ agency_id: null, is_active: false, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('agency_id', profile.agency_id!)

  if (error) {
    console.error(`[TEAM_DEBUG] DB Error removing:`, error.message)
    return { error: error.message }
  }
  console.log(`[TEAM_DEBUG] Success: Member ${memberId} detached from agency.`)
  revalidatePath('/team')
  return {}
}
