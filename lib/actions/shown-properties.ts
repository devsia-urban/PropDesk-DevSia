'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'

export type ShownProperty = {
  id: string
  created_at: string
  client_id: string
  property: {
    id: string
    title: string 
    price: number
    locality: string | null
    city: string | null
    property_type: string
    status: string 
    listing_type: string
    cover_image_url: string | null
  } | null
}

export async function getShownProperties(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_shown_properties')
    .select(`
      id,
      created_at,
      client_id,
      property:properties(id, title, price, locality, city, property_type, status, listing_type, cover_image_url)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching shown properties:", error)
    return []
  }

  return data as unknown as ShownProperty[]
}

export async function linkShownProperty(params: {
  clientId: string
  propertyId?: string | null
  externalTitle?: string
  externalLocation?: string
  notes?: string
}) {
  const { clientId, propertyId, externalTitle, externalLocation, notes } = params
  const profile = await requireProfile()
  const supabase = await createClient()

  if (!profile.agency_id) {
    throw new Error("User must belong to an agency to link properties")
  }

  const { data, error } = await supabase
    .from('client_shown_properties')
        .insert({
      agency_id: profile.agency_id,
      client_id: clientId,
      property_id: propertyId,
      agent_id: profile.id,
      status: 'shown'
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
       return { error: "Property already linked to this client" }
    }
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { data }
}

export async function unlinkShownProperty(id: string, clientId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_shown_properties')
    .delete()
    .match({ id, agency_id: profile.agency_id })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
