'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/get-session'
import { SaasLead, SaasLeadStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

export async function getSaasLeads(): Promise<SaasLead[]> {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saas_leads')
    .select(`
      *,
      assignee:profiles!saas_leads_assigned_to_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saas leads:', error)
    return []
  }

  return data as any
}

export async function createSaasLead(data: Partial<SaasLead>) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('saas_leads')
    .insert([data])

  if (error) {
    console.error('Error creating saas lead:', error)
    throw new Error('Failed to create SaaS lead')
  }

  revalidatePath('/superadmin/leads')
}

export async function updateSaasLead(id: string, data: Partial<SaasLead>) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('saas_leads')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating saas lead:', error)
    throw new Error('Failed to update SaaS lead')
  }

  revalidatePath('/superadmin/leads')
}

export async function deleteSaasLead(id: string) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('saas_leads')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting saas lead:', error)
    throw new Error('Failed to delete SaaS lead')
  }

  revalidatePath('/superadmin/leads')
}
