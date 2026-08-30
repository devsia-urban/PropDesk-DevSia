'use server'

import { requireProfile } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { Agency, Profile } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getMyProfile(): Promise<Profile | null> {
  const profile = await requireProfile()
  return profile
}

export async function updateProfile(data: {
  full_name: string
  phone?: string
  designation?: string
  rera_number?: string
}): Promise<{ error?: string }> {
  const profile = await requireProfile()

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone || null,
      designation: data.designation || null,
      rera_number: data.rera_number || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function getAgency(): Promise<Agency | null> {
  const profile = await requireProfile()
  if (!profile.agency_id) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', profile.agency_id)
    .single()

  if (error || !data) return null
  return data as Agency
}

export async function updateAgency(data: {
  name: string
  website?: string
  address?: string
  contact_phone?: string
  contact_email?: string
  rera_number?: string
}): Promise<{ error?: string }> {
  const profile = await requireProfile()
  if (profile.role !== 'admin') return { error: 'Only admins can update agency details' }
  if (!profile.agency_id) return { error: 'No agency linked to your account' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('agencies')
    .update({
      name: data.name,
      website: data.website || null,
      address: data.address || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      rera_number: data.rera_number || null,
    })
    .eq('id', profile.agency_id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}
