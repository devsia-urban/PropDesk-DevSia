'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireProfile } from '@/lib/auth/get-session'
import { ClientFormValues, ClientFilters } from '@/lib/validations/client'
import { Client, Profile, ClientStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { notifyAgencyAdmins } from '@/lib/services/notification'

// Note: Ensure `formatBudget` exists if needed, or inline formatting for notifications
import { formatBudgetRange } from '@/lib/utils/format'

export type ClientWithAssignee = Client & {
  assignee: Profile | null
  broker_relations?: any[]
}

export async function createClient(formData: ClientFormValues) {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  // 1. Insert into clients table
  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      ...formData,
      agency_id: profile.agency_id,
      created_by: profile.id,
      assigned_to: formData.assigned_to || profile.id,
      status: 'active',
    })
    .select()
    .single()

  if (insertError || !client) {
    return { error: insertError?.message || 'Failed to create client' }
  }

  // 2. Trigger match engine (handled via DB triggers or separate flow)
  // Removed manual fetch trigger as per user request.

  // 3. Trigger Notifications
  const isAssignedToOther = formData.assigned_to && formData.assigned_to !== profile.id
  
  // Notify the Agent specifically if assigned
  if (isAssignedToOther) {
    const { sendUserNotification } = await import('@/lib/services/notification')
    await sendUserNotification(formData.assigned_to!, profile.agency_id!, {
      type: 'new_client',
      title: '👤 New Lead Assigned',
      message: `You have been assigned to ${client.full_name}. Tap to view requirements.`,
      referenceId: client.id,
      referenceType: 'client'
    })
  }

  // Notify Admins about the assignment
  await notifyAgencyAdmins(profile.agency_id as string, {
    type: 'new_client',
    title: '🤝 Lead Assigned',
    message: `${client.full_name} has been assigned to ${isAssignedToOther ? 'an agent' : 'you'} by ${profile.full_name}`,
    referenceId: client.id,
    referenceType: 'client'
  }, profile.id)

  // Record activity
  let assignedToName = 'you'
  if (isAssignedToOther) {
    const { data: assignee } = await supabase.from('profiles').select('full_name').eq('id', formData.assigned_to!).single()
    assignedToName = assignee?.full_name || 'an agent'
  }

  await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'assign',
      entity_type: 'client',
      entity_id: client.id,
      details: { 
        title: client.full_name,
        assigned_to_id: formData.assigned_to || profile.id,
        assigned_to_name: assignedToName
      }
    })

  revalidatePath('/clients')
  revalidatePath('/dashboard')
  return { data: client as Client }
}

export async function updateClient(id: string, formData: Partial<ClientFormValues>) {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  // 🛡️ SECURITY LOCK: Agents cannot re-assign leads
  if (profile.role === 'agent' && formData.assigned_to && formData.assigned_to !== profile.id) {
    return { error: 'Permission denied. Only Admins can re-assign leads.' }
  }

  const { data: client, error } = await supabase
    .from('clients')
    .update(formData)
    .match({ id, agency_id: profile.agency_id })
    .select()
    .single()

  if (error) return { error: error.message }

  // 🔔 Trigger Notification for Agent Assignment
  if (formData.assigned_to && formData.assigned_to !== profile.id) {
    // 🔔 Trigger Push Notification for Agent Assignment
    const { data: agentProfile } = await supabase.from('profiles').select('full_name').eq('id', formData.assigned_to).single()
    const { sendUserNotification } = await import('@/lib/services/notification')
    await sendUserNotification(formData.assigned_to, profile.agency_id as string, {
      type: 'new_client',
      title: '👤 New Lead Assigned',
      message: `You have been assigned to ${client.full_name}. Tap to view requirements.`,
      referenceId: client.id,
      referenceType: 'client'
    })

    // Record activity for the agent
    await supabase.from('activities').insert({
      agency_id: profile.agency_id,
      user_id: profile.id, // The actor is the one performing the update
      action: 'assign',
      entity_type: 'client',
      entity_id: client.id,
      details: { 
        title: client.full_name,
        assigned_to_id: formData.assigned_to,
        assigned_to_name: agentProfile?.full_name || 'an agent'
      }
    })
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  revalidatePath('/dashboard')
  return { data: client as Client }
}

export async function deleteClient(id: string) {
  const profile = await requireProfile()

  // 🛡️ SECURITY LOCK: Only Admins can delete
  if (profile.role !== 'admin') {
    return { error: 'Permission denied. Only Admins can delete leads.' }
  }
  // The anon client's RLS WITH CHECK fails when auth.uid() is unavailable
  // in the server action execution context.
  const { error } = await supabaseAdmin
    .from('clients')
    .update({ is_deleted: true })
    .match({ id, agency_id: profile.agency_id })

  if (error) return { error: error.message }

  // Record activity
  await supabaseAdmin
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'delete',
      entity_type: 'client',
      entity_id: id,
      details: { title: 'Client removed' }
    })

  // Dismiss any related matches
  await supabaseAdmin
    .from('matches')
    .update({ status: 'dismissed' })
    .match({ client_id: id, agency_id: profile.agency_id })

  // 🔔 Trigger Notifications
  const { data: clientName } = await supabaseAdmin.from('clients').select('full_name').eq('id', id).single()
  await notifyAgencyAdmins(profile.agency_id as string, {
    type: 'new_client',
    title: '🗑️ Client Deleted',
    message: `${profile.full_name} removed the client: ${clientName?.full_name || 'Unknown'}`,
  }, profile.id)

  revalidatePath('/clients')
  revalidatePath('/dashboard')
  return { data: { success: true } }
}

export async function updateClientStatus(id: string, status: ClientStatus) {
  return updateClient(id, { status } as any)
}

export async function getClient(id: string) {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      assignee:profiles!clients_assigned_to_fkey(*),
      broker_relations:broker_client_relations(
        *,
        broker:brokers(*)
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) return null
  return data as ClientWithAssignee
}

export async function getClients(filters: ClientFilters) {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  const pageSize = 30
  const currentPage = filters.page || 1
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Core query with count enabled
  // console.log(`[DIAGNOSTIC] Fetching clients for User: ${profile.id}, Role: ${profile.role}`)

  let query = supabase
    .from('clients')
    .select(`*, assignee:profiles!clients_assigned_to_fkey(*)`, { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)

  // 🛡️ Manual Security Layer (Backup for RLS)
  if (profile.role === 'agent') {
    // console.log(`[DIAGNOSTIC] Applying Agent Filter for: ${profile.id}`)
    query = query.eq('assigned_to', profile.id)
  }

  // 2. Apply all filters BEFORE range/order for accurate counting
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  if (filters.property_types && filters.property_types.length > 0) {
    query = query.overlaps('property_types', filters.property_types)
  }

  if (filters.budget_min) {
    query = query.gte('budget_max', filters.budget_min)
  }

  if (filters.budget_max) {
    query = query.lte('budget_min', filters.budget_max)
  }

  if (filters.looking_for && filters.looking_for !== 'any') {
    query = query.eq('looking_for', filters.looking_for)
  }

  if (filters.status && filters.status !== 'all' && filters.status !== 'any') {
    query = query.eq('status', filters.status)
  }

  if (profile.role === 'admin' && filters.assigned_to && filters.assigned_to !== 'all' && filters.assigned_to !== 'any') {
    query = query.eq('assigned_to', filters.assigned_to)
  }

  // 3. Apply Ordering and Range LAST
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    // Handle "Requested range not satisfiable" (PGRST103)
    if (error.code === 'PGRST103') {
      return { data: [], count: count || 0, page: currentPage, totalPages: Math.ceil((count || 0) / pageSize) }
    }
    console.error('Error fetching clients:', error)
    throw new Error(`Failed to fetch clients: ${error.message}`)
  }

  return {
    data: data as ClientWithAssignee[],
    count: count || 0,
    page: currentPage,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function getTeamMembers() {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('agency_id', profile.agency_id)
    .eq('is_active', true)

  if (error) return []
  return data as Profile[]
}

export async function getUpcomingFollowUps() {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  // Format the exact current date/time in UTC
  const now = new Date().toISOString()

  let query = supabase
    .from('clients')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)
    .neq('status', 'closed')
    .not('follow_up_date', 'is', null)
    .gt('follow_up_date', now) // Only future follow-ups

  if (profile.role === 'agent') {
    query = query.eq('assigned_to', profile.id)
  }

  const { data, error } = await query
    .order('follow_up_date', { ascending: true })

  if (error) {
    console.error("Error fetching upcoming followups:", error)
    return []
  }
  return data as Client[]
}

export async function getOverdueFollowUps() {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  // Format the exact current date/time in UTC
  const now = new Date().toISOString()

  let query = supabase
    .from('clients')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)
    .neq('status', 'closed')
    .not('follow_up_date', 'is', null)
    .lte('follow_up_date', now) // Past or current follow-ups

  if (profile.role === 'agent') {
    query = query.eq('assigned_to', profile.id)
  }

  const { data, error } = await query
    .order('follow_up_date', { ascending: false }) // Oldest first or newest first? Newest overdue is usually more relevant, so descending

  if (error) {
    console.error("Error fetching overdue followups:", error)
    return []
  }
  return data as Client[]
}

export async function completeFollowUp(clientId: string) {
  const profile = await requireProfile()
  const supabase = await createSupabaseClient()

  // 🛡️ Security Layer: Ensure the user belongs to the same agency
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('agency_id, assigned_to')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return { error: "Client not found." }
  }

  if (client.agency_id !== profile.agency_id) {
    return { error: "Unauthorized access to this client." }
  }
  
  if (profile.role === 'agent' && client.assigned_to !== profile.id) {
    return { error: "You can only update your own clients." }
  }

  const { error } = await supabase
    .from('clients')
    .update({ 
      follow_up_date: null, 
      follow_up_reason: null 
    })
    .eq('id', clientId)

  if (error) {
    return { error: "Failed to mark follow-up as completed." }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/dashboard')
  revalidatePath('/clients')
  return { success: true }
}
