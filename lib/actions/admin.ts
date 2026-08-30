'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'

export async function inviteAgencyOwner(email: string, agencyId: string) {
  await requireSuperAdmin()
  
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite`,
    data: {
      agency_id: agencyId,
      role: 'admin'
    }
  })

  if (error) {
    console.error('Invite error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/superadmin')
  return data
}

export async function getAllAgencies() {
  await requireSuperAdmin()
  // Use supabaseAdmin to bypass RLS and get accurate total counts
  const { data, error } = await supabaseAdmin
    .from('agencies')
    .select('*, profiles(count), properties(count), clients(count), schemes(count)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching agencies:', error)
    throw new Error('Failed to fetch agencies')
  }

  return data
}

export async function updateAgencySubscription(agencyId: string, updates: { 
  subscription_status?: 'trial' | 'active' | 'paused' | 'expired',
  subscription_end_date?: string,
  plan_type?: 'free' | 'monthly' | 'yearly'
}) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('agencies')
    .update(updates)
    .eq('id', agencyId)

  if (error) {
    throw new Error('Failed to update subscription')
  }

  revalidatePath('/superadmin')
  revalidatePath('/dashboard')
}

export async function createAgency(data: {
  name: string,
  contact_email: string,
  plan_type: 'free' | 'monthly' | 'yearly',
  subscription_status: 'trial' | 'active'
}) {
  await requireSuperAdmin()
  const supabase = await createClient()

  // Set subscription end date (default 7 days for trial, 30 for monthly)
  const days = data.subscription_status === 'trial' ? 7 : 30
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  const { data: agency, error } = await supabase
    .from('agencies')
    .insert([{
      name: data.name,
      contact_email: data.contact_email,
      plan_type: data.plan_type,
      subscription_status: data.subscription_status,
      subscription_end_date: endDate.toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating agency:', error)
    throw new Error('Failed to create agency')
  }

  revalidatePath('/superadmin')
  return agency
}
