'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'

export type ClientPropertyLink = {
  id: string
  agency_id: string
  client_id: string
  property_id: string
  relation_type: 'sell' | 'rent_out'
  notes: string | null
  created_at: string
  property?: any
}

/**
 * Fetch all properties linked to a client (i.e. properties they want to sell/rent out).
 */
export async function getClientPropertyLinks(clientId: string): Promise<ClientPropertyLink[]> {
  const supabase = await createClient()
  const profile = await requireProfile()

  const { data, error } = await supabase
    .from('client_property_links')
    .select(`
      *,
      property:properties(
        id, title, city, locality, price, cover_image_url,
        property_type, status, bhk, bedrooms, area_sqft, area_unit, listing_type
      )
    `)
    .eq('client_id', clientId)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client property links:', error)
    return []
  }

  return data as ClientPropertyLink[]
}

/**
 * Link an existing property to a client (sell/rent-out intent).
 * Idempotent — if the pair already exists the duplicate is silently ignored.
 */
export async function linkPropertyToClient(
  clientId: string,
  propertyId: string,
  relationType: 'sell' | 'rent_out' = 'sell',
  notes?: string
) {
  const supabase = await createClient()
  const profile = await requireProfile()

  const { data, error } = await supabase
    .from('client_property_links')
    .upsert(
      {
        agency_id: profile.agency_id,
        client_id: clientId,
        property_id: propertyId,
        relation_type: relationType,
        notes: notes || null,
      },
      { onConflict: 'client_id,property_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) {
    console.error('Error linking property to client:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/properties/${propertyId}`)
  return { data }
}

/**
 * Remove a link between a client and a property.
 */
export async function unlinkPropertyFromClient(linkId: string, clientId: string) {
  const supabase = await createClient()
  const profile = await requireProfile()

  const { error } = await supabase
    .from('client_property_links')
    .delete()
    .eq('id', linkId)
    .eq('agency_id', profile.agency_id)

  if (error) {
    console.error('Error removing client property link:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { data: { success: true } }
}

export type SellerClientForProperty = {
  id: string           // link id
  client_id: string
  notes: string | null
  relation_type: string
  client: {
    id: string
    full_name: string
    phone: string
    email: string | null
    status: string
  } | null
}

/**
 * Reverse lookup: given a property, find all clients who are selling/rent-out that property.
 * Used to auto-show the seller client card on the property detail page.
 */
export async function getSellerClientsForProperty(propertyId: string): Promise<SellerClientForProperty[]> {
  const supabase = await createClient()
  const profile = await requireProfile()

  const { data, error } = await supabase
    .from('client_property_links')
    .select(`
      id,
      client_id,
      notes,
      relation_type,
      client:clients(
        id, full_name, phone, email, status
      )
    `)
    .eq('property_id', propertyId)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching seller clients for property:', error?.message || error, error?.details || '');
    return []
  }

  return data as unknown as SellerClientForProperty[]
}
