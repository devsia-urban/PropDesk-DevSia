'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { PropertyFormValues, PropertyFilters } from '@/lib/validations/property'
import { Property, PropertyStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { toSlug } from '@/lib/utils/slug'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyAgencyAdmins, sendUserNotification } from '@/lib/services/notification'

export type PropertyWithCreator = Property & {
  profiles: {
    full_name: string
  }
  broker_relations?: any[]
}

export type PublicProperty = Property & {
  agency: {
    name: string
    logo_url: string | null
    contact_phone: string | null
    contact_email: string | null
    website: string | null
    rera_number: string | null
    facebook_url: string | null
    instagram_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
  }
  profiles?: {
    full_name: string
  } | null
}

async function generateUniqueSlug(title: string | null | undefined, agencyId: string, excludeId?: string): Promise<string> {
  const supabase = await createClient()
  const base = toSlug(title)

  let candidate = base
  let counter = 2

  while (true) {
    let query = supabase
      .from('properties')
      .select('id')
      .eq('slug', candidate)
      .eq('agency_id', agencyId)
      .eq('is_deleted', false)

    if (excludeId) query = query.neq('id', excludeId)

    const { data } = await query

    if (!data || data.length === 0) return candidate

    candidate = `${base}-${counter}`
    counter++
  }
}

export async function createProperty(formData: PropertyFormValues) {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (!profile.agency_id) {
    throw new Error("User must belong to an agency to create properties")
  }

  // Always generate a clean, unique slug from the title
  const uniqueSlug = await generateUniqueSlug(
    formData.slug ?? formData.title,
    profile.agency_id
  )

  const { source_broker_id, ...propertyData } = formData

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...propertyData,
      slug: uniqueSlug,
      agency_id: profile.agency_id,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Record linkage to broker if provided
  if (source_broker_id) {
    const { error: linkError } = await supabase
      .from('broker_property_relations')
      .insert({
        agency_id: profile.agency_id,
        broker_id: source_broker_id,
        property_id: data.id,
        relation_type: 'sourced'
      })
    if (linkError) console.error("Link error:", linkError)
  }

  // Record activity
  await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'create',
      entity_type: 'property',
      entity_id: data.id,
      details: { title: data.title }
    })

  // 🔔 Trigger Notifications
  // Notify everyone in the agency about the new property
  await notifyAgencyAdmins(profile.agency_id, {
    type: 'property_update',
    title: '🏠 New Property Added',
    message: `${profile.full_name} added a new property: ${data.title}`,
    referenceId: data.id,
    referenceType: 'property'
  }, profile.id)

  revalidatePath('/properties')
  return { data: data as Property }
}

export async function updateProperty(id: string, formData: Partial<PropertyFormValues>) {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (!profile.agency_id) {
    throw new Error("User must belong to an agency to update properties")
  }

  const { source_broker_id, ...propertyData } = formData

  const { data, error } = await supabase
    .from('properties')
    .update(propertyData)
    .match({ id, agency_id: profile.agency_id })
    .select()
    .single()

  if (error) return { error: error.message }

  // Sync linkage to broker if provided
  if (source_broker_id) {
    // Delete existing sourced link for this property first
    await supabase
      .from('broker_property_relations')
      .delete()
      .eq('property_id', id)
      .eq('relation_type', 'sourced')

    const { error: linkError } = await supabase
      .from('broker_property_relations')
      .insert({
        agency_id: profile.agency_id,
        broker_id: source_broker_id,
        property_id: id,
        relation_type: 'sourced'
      })
    if (linkError) console.error("Link sync error:", linkError)
  }

  // Record activity
  await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'update',
      entity_type: 'property',
      entity_id: data.id,
      details: { title: data.title }
    })

  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  return { data: data as Property }
}
export async function deleteProperty(id: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  // Only admin or creator can delete
  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('title, created_by, image_urls, cover_image_url')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError.message }

  // 🛡️ SECURITY LOCK: Only Admins can delete
  if (profile.role !== 'admin') {
    return { error: "Permission denied. Only Admins can delete properties." }
  }

  // Delete associated images from storage (User's session allows this via RLS)
  if (property.image_urls?.length || property.cover_image_url) {
    const urlsToDelete = new Set<string>()
    if (property.cover_image_url) urlsToDelete.add(property.cover_image_url)
    if (property.image_urls) property.image_urls.forEach((url: string) => urlsToDelete.add(url))

    const pathsToDelete = Array.from(urlsToDelete)
      .map(url => {
        const prefix = '/storage/v1/object/public/property-images/'
        const idx = url.indexOf(prefix)
        return idx !== -1 ? url.slice(idx + prefix.length) : null
      })
      .filter(Boolean) as string[]

    if (pathsToDelete.length > 0) {
      await supabase.storage.from('property-images').remove(pathsToDelete)
    }
  }

  const { error } = await supabaseAdmin
    .from('properties')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return { error: error.message }

  // Record activity
  await supabase
    .from('activities')
    .insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      action: 'delete',
      entity_type: 'property',
      entity_id: id,
      details: { title: property.title }
    })

  // 🔔 Trigger Notifications
  await notifyAgencyAdmins(profile.agency_id, {
    type: 'property_update',
    title: '🗑️ Property Deleted',
    message: `${profile.full_name} removed the property: ${property.title}`,
  }, profile.id)

  revalidatePath('/properties')
  return { data: { success: true } }
}

export async function updatePropertyStatus(id: string, status: PropertyStatus) {
  return updateProperty(id, { status } as any)
}

export async function getProperty(id: string) {
  const supabase = await createClient()
  const profile = await requireProfile()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *, 
      profiles:profiles!properties_created_by_fkey(full_name),
      broker_relations:broker_property_relations(
        *,
        broker:brokers(*)
      )
    `)
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .single()

  if (error) return null
  return data as PropertyWithCreator
}

export async function getProperties(filters: PropertyFilters) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const pageSize = 30
  const currentPage = filters.page || 1
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // 1. Core query with count enabled
  let query = supabase
    .from('properties')
    .select('id, title, price, property_type, status, listing_type, city, locality, cover_image_url, is_featured, is_new, bedrooms, bathrooms, area_sqft, bhk, created_at, approval_type, area_unit, profiles:profiles!properties_created_by_fkey(full_name)', { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)

  // 2. Apply all filters BEFORE range/order for accurate counting
  if (filters.search) {
    const terms = filters.search.split(' ').filter(Boolean)

    terms.forEach(term => {
      const isNum = !isNaN(Number(term))
      let orQuery = `title.ilike.%${term}%,locality.ilike.%${term}%,city.ilike.%${term}%,address.ilike.%${term}%,property_type.ilike.%${term}%,description.ilike.%${term}%,group.ilike.%${term}%`
      if (isNum) {
        orQuery += `,bhk.cs.{${term}},bedrooms.eq.${term}`
      }
      query = query.or(orQuery)
    })
  }

  if (filters.property_type && filters.property_type !== 'all' && filters.property_type !== 'any') {
    query = query.eq('property_type', filters.property_type)
  }

  if (filters.status && filters.status !== 'all' && filters.status !== 'any') {
    query = query.eq('status', filters.status)
  }

  if (filters.listing_type && filters.listing_type !== 'all' && filters.listing_type !== 'any') {
    query = query.eq('listing_type', filters.listing_type)
  }

  if (filters.approval_type && filters.approval_type !== 'all' && filters.approval_type !== 'any') {
    query = query.eq('approval_type', filters.approval_type)
  }

  if (filters.bhk && filters.bhk !== 'all' && filters.bhk !== 'any') {
    const bhkStr = String(filters.bhk)
    const bhkValues = bhkStr.split(',').map((v: string) => parseInt(v.trim())).filter((v: number) => !isNaN(v))
    if (bhkValues.length > 0) {
      query = query.filter('bhk', 'ov', `{${bhkValues.join(',')}}`)
    }
  }

  if (filters.price_min) {
    query = query.gte('price', filters.price_min)
  }

  if (filters.price_max) {
    query = query.lte('price', filters.price_max)
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
    console.error('Error fetching properties:', error)
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  return {
    data: data as unknown as Property[],
    count: count || 0,
    page: currentPage,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}
export async function getPublicProperty(slug: string) {
  // Use admin client to bypass dealer-only RLS for public viewing
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select(`
      *,
      agency:agencies(
        name,
        logo_url,
        contact_phone,
        contact_email,
        website,
        rera_number,
        facebook_url,
        instagram_url,
        linkedin_url,
        twitter_url
      ),
      profiles:profiles!properties_created_by_fkey(full_name)
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single()

  if (error) {
    console.error("Error fetching public property:", error)
    return null
  }
  
  return data as PublicProperty
}
