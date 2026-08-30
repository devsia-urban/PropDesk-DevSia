'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Broker, BrokerPropertyRelation, BrokerClientRelation } from '@/lib/types/database'

export type BrokerFilters = {
  search?: string
  broker_type?: 'freelance' | 'agency'
  specialty?: string
  page?: number
}

export async function getBrokers(filters?: BrokerFilters) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const pageSize = 30
  const currentPage = filters?.page || 1
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Core query with count enabled
  let query = supabase
    .from('brokers')
    .select('*', { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)

  // 2. Apply all filters BEFORE range/order for accurate counting
  if (filters?.search) {
    query = query.ilike('full_name', `%${filters.search}%`)
  }

  if (filters?.broker_type && filters.broker_type !== ('any' as any)) {
    query = query.eq('broker_type', filters.broker_type)
  }

  if (filters?.specialty && filters.specialty !== ('any' as any)) {
    query = query.contains('specialties', [filters.specialty])
  }

  // 3. Apply Ordering and Range LAST
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    // Handle "Requested range not satisfiable" (PGRST103)
    if (error.code === 'PGRST103') {
      return { 
        data: [], 
        count: count || 0, 
        page: currentPage, 
        totalPages: Math.ceil((count || 0) / pageSize) 
      }
    }
    console.error('Error fetching brokers:', error)
    throw new Error(`Failed to fetch brokers: ${error.message}`)
  }

  return {
    data: data as Broker[],
    count: count || 0,
    page: currentPage,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

export async function getBrokerById(id: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('brokers')
    .select(`
      *,
      relations:broker_property_relations(
        *,
        property:properties(*)
      ),
      client_relations:broker_client_relations(
        *,
        client:clients(*)
      )
    `)
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .single()

  if (error) {
    console.error('Error fetching broker:', error)
    return null
  }

  return data as Broker & { 
    relations: (BrokerPropertyRelation & { property: any })[],
    client_relations: (BrokerClientRelation & { client: any })[]
  }
}

export async function createBroker(data: Partial<Broker>) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: broker, error } = await supabase
    .from('brokers')
    .insert({
      ...data,
      agency_id: profile.agency_id,
      created_by: profile.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating broker:', error)
    return { error: error.message }
  }

  revalidatePath('/brokers')
  return { data: broker as Broker }
}

export async function updateBroker(id: string, data: Partial<Broker>) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: broker, error } = await supabase
    .from('brokers')
    .update(data)
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating broker:', error)
    return { error: error.message }
  }

  revalidatePath('/brokers')
  revalidatePath(`/brokers/${id}`)
  return { data: broker as Broker }
}

export async function deleteBroker(id: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabaseAdmin
    .from('brokers')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('agency_id', profile.agency_id)

  if (error) {
    console.error('Error deleting broker:', error)
    return { error: error.message }
  }

  revalidatePath('/brokers')
  return { success: true }
}

export async function linkPropertyToBroker(
  brokerId: string, 
  propertyId: string, 
  relationType: 'sourced' | 'shared',
  notes?: string
) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('broker_property_relations')
    .insert({
      agency_id: profile.agency_id,
      broker_id: brokerId,
      property_id: propertyId,
      relation_type: relationType,
      notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error linking property to broker:', error)
    return { error: error.message }
  }

  revalidatePath(`/brokers/${brokerId}`)
  revalidatePath(`/properties/${propertyId}`)
  return { data }
}

export async function linkClientToBroker(
  brokerId: string, 
  clientId: string, 
  relationType: 'sourced' | 'shared',
  notes?: string
) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('broker_client_relations')
    .insert({
      agency_id: profile.agency_id,
      broker_id: brokerId,
      client_id: clientId,
      relation_type: relationType,
      notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error linking client to broker:', error)
    return { error: error.message }
  }

  revalidatePath(`/brokers/${brokerId}`)
  revalidatePath(`/clients/${clientId}`)
  return { data }
}
