'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/actions/activities'
import { sendUserNotification, notifyAgencyAdmins } from '@/lib/services/notification'
import { BookingWithDetails } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// SEARCH CLIENTS FOR BOOKING FORM
// ─────────────────────────────────────────
export async function searchClientsForBooking(query: string): Promise<{ id: string; full_name: string; phone: string }[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const searchTerm = `%${query}%`
  const { data, error } = await supabase
    .from('clients')
    .select('id, full_name, phone')
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)
    .or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .limit(6)

  if (error) {
    console.error('[searchClients] error:', error)
    return []
  }

  return (data || []).map(c => ({
    id: c.id,
    full_name: c.full_name || '',
    phone: c.phone || '',
  }))
}

// ─────────────────────────────────────────
// CREATE BOOKING (Hold or Book)
// ─────────────────────────────────────────
export async function createBooking(formData: {
  propertyId: string
  bookingType: 'hold' | 'booked'
  customerName: string
  customerPhone?: string
  customerAadhaar?: string
  clientId?: string
  agentRera?: string
  amount?: number
  notes?: string
  unitId?: string
}) {
  const profile = await requireProfile()
  const supabase = await createClient()

  // Check if property/unit is already hold/booked
  const query = supabase
    .from('property_bookings')
    .select('id, booking_type, status')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'active')
    .limit(1)

  if (formData.unitId) {
    query.eq('unit_id', formData.unitId)
  } else {
    query.eq('property_id', formData.propertyId)
  }

  const { data: existingActive } = await query

  if (existingActive && existingActive.length > 0) {
    return { error: 'This already has an active hold or booking.' }
  }

  // Calculate hold expiry (24 hours from now)
  const holdExpiresAt = formData.bookingType === 'hold'
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null

  // Insert booking record
  const { data: booking, error } = await supabase
    .from('property_bookings')
    .insert({
      agency_id: profile.agency_id!,
      property_id: formData.unitId ? null : formData.propertyId,
      unit_id: formData.unitId || null,
      agent_id: profile.id,
      agent_name: profile.full_name,
      agent_phone: profile.phone || null,
      agent_rera: formData.agentRera || profile.rera_number || null,
      customer_name: formData.customerName,
      customer_phone: formData.customerPhone || null,
      customer_aadhaar: formData.customerAadhaar || null,
      client_id: formData.clientId || null,
      booking_type: formData.bookingType,
      status: 'active',
      hold_expires_at: holdExpiresAt,
      notes: formData.notes || null,
      amount: formData.amount || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Update status
  const newStatus = formData.bookingType === 'hold' ? 'hold' : 'booked'
  if (formData.unitId) {
    await supabaseAdmin.from('units').update({ status: newStatus }).eq('id', formData.unitId)
  } else {
    await supabaseAdmin.from('properties').update({ status: newStatus }).eq('id', formData.propertyId)
  }

  // Get display title
  let displayTitle = 'Property'
  if (formData.unitId) {
    const { data: unit } = await supabase
      .from('units')
      .select('unit_number, scheme:schemes(name)')
      .eq('id', formData.unitId)
      .single()
    displayTitle = unit ? `${unit.unit_number} (${(unit.scheme as any)?.name})` : 'Unit'
  } else {
    const { data: property } = await supabase
      .from('properties')
      .select('title')
      .eq('id', formData.propertyId)
      .single()
    displayTitle = property?.title || 'Property'
  }

  // Log activity
  const actionWord = formData.bookingType === 'hold' ? 'hold' : 'booked'
  await logActivity({
    action: formData.bookingType as any,
    entityType: formData.unitId ? 'unit' as any : 'property',
    entityId: (formData.unitId || formData.propertyId)!,
    details: {
      title: displayTitle,
      name: `${actionWord} for ${formData.customerName}`,
      booking_type: formData.bookingType,
      customer_name: formData.customerName,
    }
  })

  // Notify admin(s)
  const emoji = formData.bookingType === 'hold' ? '🔒' : '✅'
  const typeWord = formData.bookingType === 'hold' ? 'placed a 24hr hold on' : 'booked'
  await notifyAgencyAdmins(profile.agency_id!, {
    type: 'property_update',
    title: `${emoji} ${formData.unitId ? 'Unit' : 'Property'} ${formData.bookingType === 'hold' ? 'Hold' : 'Booked'}`,
    message: `${profile.full_name} ${typeWord} ${displayTitle} for ${formData.customerName}.`,
    referenceId: (formData.unitId || formData.propertyId)!,
    referenceType: formData.unitId ? 'unit' : 'property'
  }, profile.id)

  if (formData.unitId) {
    revalidatePath('/schemes', 'layout')
  } else {
    revalidatePath('/properties', 'layout')
    revalidatePath(`/properties/${formData.propertyId}`)
  }
  revalidatePath('/bookings', 'layout')
  revalidatePath('/dashboard', 'layout')
  return { data: booking }
}

// ─────────────────────────────────────────
// CLEANUP EXPIRED HOLDS
// ─────────────────────────────────────────
export async function checkAndReleaseExpiredHolds() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // 1. Find expired active holds
  const { data: expiredHolds, error: fetchError } = await supabase
    .from('property_bookings')
    .select(`
      id, 
      property_id, 
      unit_id,
      agent_id, 
      agency_id,
      customer_name,
      property:properties(title),
      unit:units(unit_number, scheme:schemes(name))
    `)
    .eq('booking_type', 'hold')
    .eq('status', 'active')
    .lt('hold_expires_at', now)

  if (fetchError || !expiredHolds || expiredHolds.length === 0) return { success: true, count: 0 }

  let releasedCount = 0

  for (const hold of expiredHolds) {
    const propertyTitle = (hold.property as any)?.title || 'Property'

    // 2. Update booking to expired
    await supabase
      .from('property_bookings')
      .update({ status: 'expired' })
      .eq('id', hold.id)

    // 3. Reset property status to available
    await supabase
      .from('properties')
      .update({ status: 'available' })
      .eq('id', hold.property_id)

    // 4. Log Activity
    await logActivity({
      action: 'delete', // Using delete/remove type for release
      entityType: 'property',
      entityId: hold.property_id,
      details: {
        title: propertyTitle,
        name: `Hold expired for ${hold.customer_name}`,
        reason: '24h limit reached'
      }
    })

    // 5. Notify the Agent
    await sendUserNotification(hold.agent_id, hold.agency_id, {
      type: 'system',
      title: '🔒 Hold Expired',
      message: `Your 24-hour hold on "${propertyTitle}" has expired. The property is now available for others.`,
      referenceId: hold.property_id,
      referenceType: 'property'
    })

    releasedCount++
  }

  if (releasedCount > 0) {
    revalidatePath('/properties')
    revalidatePath('/bookings')
    revalidatePath('/dashboard')
  }

  return { success: true, count: releasedCount }
}


// ─────────────────────────────────────────
// GET ALL BOOKINGS
// ─────────────────────────────────────────
export async function getBookings(filters?: {
  status?: string
  bookingType?: string
}): Promise<BookingWithDetails[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  // Auto-release expired holds before fetching
  await releaseExpiredHolds()

  let query = supabase
    .from('property_bookings')
    .select(`
      *,
      property:properties!property_id(id, title, locality, city, price, property_type, cover_image_url, status),
      unit:units!unit_id(
        id, 
        unit_number, 
        status, 
        scheme:schemes(id, name, location_details)
      ),
      agent:profiles!agent_id(id, full_name, phone, avatar_url)
    `)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.bookingType && filters.bookingType !== 'all') {
    query = query.eq('booking_type', filters.bookingType)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getBookings] error:', error)
    throw new Error(`Failed to fetch bookings: ${error.message}`)
  }

  return (data || []) as unknown as BookingWithDetails[]
}

// ─────────────────────────────────────────
// CONVERT HOLD → BOOKED
// ─────────────────────────────────────────
export async function convertHoldToBooked(bookingId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: booking, error: fetchError } = await supabase
    .from('property_bookings')
    .select('*, property:properties(title), unit:units(unit_number, scheme:schemes(name))')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }
  if (booking.status !== 'active' || booking.booking_type !== 'hold') {
    return { error: 'Only active holds can be converted to bookings.' }
  }

  const { error } = await supabase
    .from('property_bookings')
    .update({
      booking_type: 'booked',
      hold_expires_at: null,
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  let propertyTitle = 'Property'

  // Update property/unit status using admin bypass
  if (booking.unit_id) {
    await supabaseAdmin.from('units').update({ status: 'booked' }).eq('id', booking.unit_id)
    propertyTitle = `${(booking as any).unit?.unit_number} (${(booking as any).unit?.scheme?.name})`
  } else {
    await supabaseAdmin.from('properties').update({ status: 'booked' }).eq('id', booking.property_id)
    propertyTitle = (booking as any).property?.title || 'Property'
  }

  await logActivity({
    action: 'converted',
    entityType: booking.unit_id ? 'unit' : 'property',
    entityId: booking.unit_id || booking.property_id,
    details: { title: propertyTitle, name: `booked for ${booking.customer_name}` }
  })

  await notifyAgencyAdmins(profile.agency_id!, {
    type: 'property_update',
    title: '✅ Hold Converted to Booking',
    message: `${profile.full_name} confirmed booking of ${propertyTitle} for ${booking.customer_name}.`,
    referenceId: booking.unit_id || booking.property_id,
    referenceType: booking.unit_id ? 'unit' : 'property'
  }, profile.id)

  revalidatePath('/bookings', 'layout')
  if (booking.unit_id) {
    revalidatePath('/schemes', 'layout')
  } else {
    revalidatePath('/properties', 'layout')
  }
  return { success: true }
}

// ─────────────────────────────────────────
// REQUEST CANCEL (Agent → Admin approval)
// ─────────────────────────────────────────
export async function requestCancelBooking(bookingId: string, reason?: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: booking, error: fetchError } = await supabase
    .from('property_bookings')
    .select('*, property:properties!property_id(title)')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }

  // If admin, cancel directly
  if (profile.role === 'admin') {
    return cancelBooking(bookingId)
  }

  // Agent: request cancellation
  const { error } = await supabase
    .from('property_bookings')
    .update({ status: 'cancel_requested', notes: reason ? `Cancel reason: ${reason}` : booking.notes })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  const propertyTitle = (booking as any).property?.title || 'Property'

  await logActivity({
    action: 'update',
    entityType: 'property',
    entityId: booking.property_id,
    details: { title: propertyTitle, name: `cancel requested by ${profile.full_name}` }
  })

  await notifyAgencyAdmins(profile.agency_id!, {
    type: 'property_update',
    title: '⚠️ Cancel Request',
    message: `${profile.full_name} is requesting to cancel the booking of ${propertyTitle} for ${booking.customer_name}.${reason ? ` Reason: ${reason}` : ''}`,
    referenceId: booking.property_id,
    referenceType: 'property'
  })

  revalidatePath('/bookings')
  return { success: true }
}

// ─────────────────────────────────────────
// CANCEL BOOKING (Admin only)
// ─────────────────────────────────────────
export async function releaseHold(bookingId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: booking, error: fetchError } = await supabase
    .from('property_bookings')
    .select('*, property:properties(title), unit:units(unit_number, scheme:schemes(name))')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }
  
  // Verify ownership
  if (booking.agent_id !== profile.id && profile.role !== 'admin') {
    return { error: 'Unauthorized to release this hold.' }
  }

  if (booking.booking_type !== 'hold' || booking.status !== 'active') {
    return { error: 'Only active holds can be released.' }
  }

  const { error } = await supabaseAdmin
    .from('property_bookings')
    .update({ status: 'released' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  let displayTitle = 'Property'

  // Update status
  if (booking.unit_id) {
    await supabaseAdmin.from('units').update({ status: 'available' }).eq('id', booking.unit_id)
    displayTitle = `${(booking as any).unit?.unit_number} (${(booking as any).unit?.scheme?.name})`
  } else {
    await supabaseAdmin.from('properties').update({ status: 'available' }).eq('id', booking.property_id)
    displayTitle = (booking as any).property?.title || 'Property'
  }

  await logActivity({
    action: 'released',
    entityType: booking.unit_id ? 'unit' : 'property',
    entityId: booking.unit_id || booking.property_id,
    details: { title: displayTitle, name: `hold released by ${profile.full_name}` }
  })

  revalidatePath('/bookings', 'layout')
  if (booking.unit_id) revalidatePath('/schemes', 'layout')
  else revalidatePath('/properties', 'layout')

  return { success: true }
}

// ─────────────────────────────────────────
// CANCEL BOOKING (Admin only)
// ─────────────────────────────────────────
export async function cancelBooking(bookingId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (profile.role !== 'admin') {
    return { error: 'Only admins can cancel bookings.' }
  }

  const { data: booking, error: fetchError } = await supabase
    .from('property_bookings')
    .select('*, property:properties(title), unit:units(unit_number, scheme:schemes(name))')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }

  const { error } = await supabaseAdmin
    .from('property_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  let displayTitle = 'Property'

  // Release back to available
  if (booking.unit_id) {
    await supabaseAdmin.from('units').update({ status: 'available' }).eq('id', booking.unit_id)
    displayTitle = `${(booking as any).unit?.unit_number} (${(booking as any).unit?.scheme?.name})`
  } else {
    await supabaseAdmin.from('properties').update({ status: 'available' }).eq('id', booking.property_id)
    displayTitle = (booking as any).property?.title || 'Property'
  }

  await logActivity({
    action: 'cancelled',
    entityType: booking.unit_id ? 'unit' : 'property',
    entityId: booking.unit_id || booking.property_id,
    details: { title: displayTitle, name: `booking cancelled, item released` }
  })

  // Notify the agent who made the booking
  await sendUserNotification(booking.agent_id, profile.agency_id!, {
    type: 'property_update',
    title: '❌ Booking Cancelled',
    message: `Your booking of ${displayTitle} for ${booking.customer_name} has been cancelled by admin.`,
    referenceId: booking.unit_id || booking.property_id,
    referenceType: booking.unit_id ? 'unit' : 'property'
  })

  revalidatePath('/bookings', 'layout')
  if (booking.unit_id) revalidatePath('/schemes', 'layout')
  else revalidatePath('/properties', 'layout')
  return { success: true }
}

// ─────────────────────────────────────────
// MARK AS SOLD / RENTED
// ─────────────────────────────────────────
export async function markBookingCompleted(bookingId: string, finalStatus: 'sold' | 'rented') {
  const profile = await requireProfile()
  const supabase = await createClient()

  if (profile.role !== 'admin') {
    return { error: 'Only admins can finalize bookings.' }
  }

  const { data: booking, error: fetchError } = await supabase
    .from('property_bookings')
    .select('*, property:properties!property_id(title), unit:units!unit_id(unit_number, scheme:schemes(name))')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }

  const { error } = await supabase
    .from('property_bookings')
    .update({ status: 'converted' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  let displayTitle = 'Property'

  if (booking.unit_id) {
    await supabaseAdmin.from('units').update({ status: finalStatus }).eq('id', booking.unit_id)
    displayTitle = `${(booking as any).unit?.unit_number} (${(booking as any).unit?.scheme?.name})`
  } else {
    await supabaseAdmin.from('properties').update({ status: finalStatus }).eq('id', booking.property_id)
    displayTitle = (booking as any).property?.title || 'Property'
  }

  await logActivity({
    action: finalStatus === 'sold' ? 'booked' : 'update', // Using 'booked' as proxy for 'sold' in UI
    entityType: booking.unit_id ? 'unit' : 'property',
    entityId: (booking.unit_id || booking.property_id)!,
    details: { title: displayTitle, name: `marked as ${finalStatus}` }
  })

  revalidatePath('/bookings', 'layout')
  if (booking.unit_id) revalidatePath('/schemes', 'layout')
  else revalidatePath('/properties', 'layout')
  return { success: true }
}

// ─────────────────────────────────────────
// AUTO-RELEASE EXPIRED HOLDS
// ─────────────────────────────────────────
export async function releaseExpiredHolds() {
  const now = new Date().toISOString()

  const { data: expired } = await supabaseAdmin
    .from('property_bookings')
    .select('id, property_id, unit_id, agent_id, agency_id, customer_name, property:properties!property_id(title), unit:units(unit_number, scheme:schemes(name))')
    .eq('booking_type', 'hold')
    .eq('status', 'active')
    .lte('hold_expires_at', now)

  if (!expired || expired.length === 0) return

  for (const hold of expired) {
    // Release booking
    await supabaseAdmin
      .from('property_bookings')
      .update({ status: 'released' })
      .eq('id', hold.id)

    let displayTitle = 'Property'
    let referenceType: 'property' | 'unit' = 'property'

    // Release item
    if (hold.unit_id) {
      await supabaseAdmin.from('units').update({ status: 'available' }).eq('id', hold.unit_id)
      displayTitle = `${(hold as any).unit?.unit_number} (${(hold as any).unit?.scheme?.name})`
      referenceType = 'unit'
    } else {
      await supabaseAdmin.from('properties').update({ status: 'available' }).eq('id', hold.property_id)
      displayTitle = (hold as any).property?.title || 'Property'
    }

    // Notify agent
    await sendUserNotification(hold.agent_id, hold.agency_id, {
      type: 'property_update',
      title: '🔓 Hold Released',
      message: `Your 24hr hold on ${displayTitle} for ${hold.customer_name} has expired and been released.`,
      referenceId: hold.unit_id || hold.property_id,
      referenceType
    })

    // Notify admins
    await notifyAgencyAdmins(hold.agency_id, {
      type: 'property_update',
      title: '🔓 Hold Auto-Released',
      message: `Hold on ${displayTitle} for ${hold.customer_name} has expired and been released automatically.`,
      referenceId: hold.unit_id || hold.property_id,
      referenceType
    })
  }
  
  revalidatePath('/bookings', 'layout')
  revalidatePath('/properties', 'layout')
  revalidatePath('/schemes', 'layout')
}
