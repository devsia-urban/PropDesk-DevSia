'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAgencyAmenities() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return []

  const { data, error } = await supabase
    .from('agency_amenities')
    .select('name')
    .eq('agency_id', profile.agency_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching amenities:', error)
    return []
  }

  return data.map(item => item.name)
}

export async function addAgencyAmenity(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { error: 'No agency found' }

  const { error } = await supabase
    .from('agency_amenities')
    .insert({
      agency_id: profile.agency_id,
      name: name.trim()
    })

  if (error) {
    if (error.code === '23505') return { error: 'Amenity already exists' }
    return { error: error.message }
  }

  revalidatePath('/properties')
  return { success: true }
}

export async function getAgencyApprovalTypes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return []

  const { data, error } = await supabase
    .from('agency_approval_types')
    .select('name')
    .eq('agency_id', profile.agency_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching approval types:', error)
    return []
  }

  return data.map(item => item.name)
}

export async function addAgencyApprovalType(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { error: 'No agency found' }

  const { error } = await supabase
    .from('agency_approval_types')
    .insert({
      agency_id: profile.agency_id,
      name: name.trim()
    })

  if (error) {
    if (error.code === '23505') return { error: 'Approval type already exists' }
    return { error: error.message }
  }

  revalidatePath('/properties')
  return { success: true }
}

export async function getAgencyPlotGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return []

  const { data, error } = await supabase
    .from('agency_plot_groups')
    .select('name')
    .eq('agency_id', profile.agency_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching plot groups:', error)
    return []
  }

  return data.map(item => item.name)
}

export async function addAgencyPlotGroup(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { error: 'No agency found' }

  const { error } = await supabase
    .from('agency_plot_groups')
    .insert({
      agency_id: profile.agency_id,
      name: name.trim()
    })

  if (error) {
    if (error.code === '23505') return { error: 'Group already exists' }
    return { error: error.message }
  }

  revalidatePath('/properties')
  return { success: true }
}
