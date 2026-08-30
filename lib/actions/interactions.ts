'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'
import { notifyAgencyAdmins } from '@/lib/services/notification'

export async function logCallStart(clientId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('full_name').eq('id', clientId).single()

  await notifyAgencyAdmins(profile.agency_id!, {
    type: 'property_update',
    title: `📞 Call Started: ${client?.full_name}`,
    message: `${profile.full_name} started a call with the client: ${client?.full_name}.`,
    referenceId: clientId,
    referenceType: 'client'
  }, profile.id)

  return { success: true }
}

export async function logWhatsAppStart(clientId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('full_name').eq('id', clientId).single()

  await notifyAgencyAdmins(profile.agency_id!, {
    type: 'property_update',
    title: `💬 WhatsApp Chat: ${client?.full_name}`,
    message: `${profile.full_name} started a WhatsApp chat with: ${client?.full_name}.`,
    referenceId: clientId,
    referenceType: 'client'
  }, profile.id)

  return { success: true }
}

export async function logInteraction(params: {
  clientId: string
  type: 'call' | 'meeting' | 'whatsapp' | 'update'
  overview: string
}) {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (!profile.agency_id) return { error: "No agency found" }

  const { data, error } = await supabase
    .from('client_interactions')
    .insert({
      agency_id: profile.agency_id,
      client_id: params.clientId,
      agent_id: profile.id,
      type: params.type,
      overview: params.overview
    })
    .select()
    .single()

  if (error) {
    console.error("Interaction RLS Error:", error)
    return { error: error.message }
  }

  // 🔔 Notify Admins that an agent completed a call
  if (profile.role === 'agent') {
    const { data: client } = await supabase.from('clients').select('full_name').eq('id', params.clientId).single()
    
    await notifyAgencyAdmins(profile.agency_id, {
      type: 'property_update',
      title: `✅ Call Completed: ${client?.full_name}`,
      message: `${profile.full_name} completed call with this update: "${params.overview}"`,
      referenceId: params.clientId,
      referenceType: 'client'
    }, profile.id)
  }

  revalidatePath(`/clients/${params.clientId}`)
  return { data }
}

export async function getInteractions(clientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_interactions')
    .select(`
      *,
      agent:profiles(full_name, avatar_url)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}
