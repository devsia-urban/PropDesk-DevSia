'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'
import { Builder, Scheme, Unit, UnitWithDetails } from '@/lib/types/database'

// ─────────────────────────────────────────
// IMAGE UPLOAD
// ─────────────────────────────────────────

export async function uploadImageServer(base64: string, fileName: string, bucket: string = 'property-images') {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Remove base64 prefix
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    
    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return { url: publicUrl }
  } catch (error: any) {
    console.error('Server upload error:', error)
    return { error: error.message }
  }
}

// SQL Command:
// insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true);
// create policy "Public Access" on storage.objects for select using (bucket_id = 'property-images');
// create policy "Admin Upload" on storage.objects for insert with check (bucket_id = 'property-images' AND auth.role() = 'authenticated');

// ─────────────────────────────────────────
// CITIES & DISCOVERY
// ─────────────────────────────────────────

export async function getActiveCities() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('builders')
    .select('city')
    .order('city')
    
  if (error) {
    console.error('Error fetching active cities:', error)
    throw new Error(`Failed to fetch cities: ${error.message}`)
  }
  
  // Return unique cities
  const cities = Array.from(new Set(data?.map(b => b.city) || []))
  return cities
}

export async function getBuildersByCity(city: string) {
  const decodedCity = decodeURIComponent(city)
  const supabase = await createClient()
  const { data } = await supabase
    .from('builders')
    .select('*')
    .ilike('city', decodedCity)
    .order('name')
  
  return (data as Builder[]) || []
}

export async function getBuildersList() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('builders')
    .select('id, name, city')
    .order('name')
    
  if (error) throw new Error(error.message)
  return data
}

export async function getSchemeById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schemes')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error) throw new Error(error.message)
  return data as Scheme
}

export async function getBuilderById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error) throw new Error(error.message)
  return data as Builder
}

export async function getSchemesByBuilder(builderId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('schemes')
    .select('*')
    .eq('builder_id', builderId)
    .order('name')
  
  return (data as Scheme[]) || []
}

// ─────────────────────────────────────────
// UNIT INVENTORY
// ─────────────────────────────────────────

export async function getUnitsByScheme(schemeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('units')
    .select(`
      *,
      property_bookings (
        id,
        agent_id,
        agent_name,
        agent_phone,
        customer_name,
        customer_phone,
        customer_aadhaar,
        status,
        booking_type
      )
    `)
    .eq('scheme_id', schemeId)
    .order('unit_number')
  
  // Clean up bookings to only include active ones for easier UI consumption
  const units = data?.map(unit => {
    const activeBooking = unit.property_bookings?.find((b: any) => b.status === 'active')
    return {
      ...unit,
      active_booking: activeBooking || null
    }
  }) || []

  return units as any[]
}

export async function getUnitDetails(unitId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('units')
    .select(`
      *,
      scheme:schemes(*, builder:builders(*))
    `)
    .eq('id', unitId)
    .single()
  
  return (data as UnitWithDetails) || null
}

// ─────────────────────────────────────────
// ADMIN: MANAGEMENT
// ─────────────────────────────────────────

export async function createBuilder(formData: Partial<Builder>) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('builders')
    .insert({
      ...formData,
      agency_id: profile.agency_id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function updateBuilder(id: string, formData: Partial<Builder>) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('builders')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function createScheme(formData: Partial<Scheme>) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schemes')
    .insert({
      ...formData,
      agency_id: profile.agency_id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function bulkAddUnits(schemeId: string, units: Partial<Unit>[]) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const unitsWithAgency = units.map(u => ({
    ...u,
    scheme_id: schemeId,
    agency_id: profile.agency_id
  }))

  const { error } = await supabase
    .from('units')
    .insert(unitsWithAgency)

  if (error) throw new Error(error.message)
  
  // Update scheme unit count
  await supabase.rpc('increment_scheme_unit_count', { scheme_id: schemeId, count: units.length })
  
  revalidatePath(`/schemes/${schemeId}`)
  return { success: true }
}

export async function updateScheme(id: string, formData: Partial<Scheme>) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('schemes')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function deleteScheme(id: string) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { error } = await supabase
    .from('schemes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
}

export async function deleteBuilder(id: string) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { error } = await supabase
    .from('builders')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
}

export async function updateUnitStatus(id: string, status: 'available' | 'hold' | 'booked' | 'sold') {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function updateUnit(id: string, formData: Partial<Unit>) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
  return data
}

export async function deleteUnit(id: string) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')
  
  const supabase = await createClient()
  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/schemes')
}

// ─────────────────────────────────────────
// RECONCILIATION & SYNC
// ─────────────────────────────────────────

export async function syncInventoryStatus() {
  const profile = await requireProfile()
  const supabase = await createClient()

  // 1. Get all units for this agency
  const { data: units } = await supabase
    .from('units')
    .select('id, status, unit_number')
    .eq('agency_id', profile.agency_id)

  if (!units) return { success: false, message: 'No units found' }

  // 2. Get all active bookings for this agency
  const { data: activeBookings } = await supabase
    .from('property_bookings')
    .select('unit_id, booking_type, status')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'active')

  if (!activeBookings) return { success: false, message: 'Could not fetch bookings' }

  const bookingMap = new Map(activeBookings.filter(b => b.unit_id).map(b => [b.unit_id, b]))

  let fixedCount = 0

  for (const unit of units) {
    const booking = bookingMap.get(unit.id)
    const correctStatus = booking 
      ? (booking.booking_type === 'hold' ? 'hold' : 'booked') 
      : 'available'

    // If mismatch, fix it
    if (unit.status !== correctStatus && unit.status !== 'sold') {
      console.log(`Syncing unit ${unit.unit_number}: ${unit.status} -> ${correctStatus}`)
      await supabase
        .from('units')
        .update({ status: correctStatus })
        .eq('id', unit.id)
      fixedCount++
    }
  }

  if (fixedCount > 0) {
    revalidatePath('/schemes', 'layout')
    revalidatePath('/bookings', 'layout')
  }

  return { success: true, fixedCount }
}

