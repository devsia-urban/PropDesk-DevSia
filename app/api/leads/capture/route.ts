import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const { 
      agency_id, 
      full_name, 
      phone, 
      email, 
      notes, 
      looking_for, 
      preferred_bhks,
      property_types,
      budget_min, 
      budget_max,
      preferred_locations,
      min_area_sqft,
      possession_timeline,
      source,
      assigned_to
    } = body

    if (!agency_id || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: agency_id, full_name, and phone are required.' },
        { status: 400 }
      )
    }

    // Fetch all admins for this agency to use for notifications and fallback assignment
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('role', 'admin')

    // If no agent was explicitly assigned via URL link, fallback to the first Admin
    const final_assigned_to = assigned_to || (admins && admins.length > 0 ? admins[0].id : null)

    // Insert the new lead securely bypassing RLS
    const { data: lead, error } = await supabaseAdmin
      .from('clients')
      .insert({
        agency_id,
        full_name,
        phone,
        email: email || null,
        notes: notes || 'Lead captured via Public API/Form.',
        looking_for: looking_for || null,
        preferred_bhks: preferred_bhks || [],
        property_types: property_types || [],
        preferred_locations: preferred_locations || [],
        min_area_sqft: min_area_sqft || null,
        possession_timeline: possession_timeline || null,
        budget_min: budget_min || null,
        budget_max: budget_max || null,
        source: source || 'other',
        assigned_to: final_assigned_to,
        status: 'active',
        priority: 'high',
        is_deleted: false,
      })
      .select()
      .single()

    if (error) {
      console.error('API Lead Capture Error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead. Database error.', details: error.message },
        { status: 500 }
      )
    }

    // Determine who gets notified: The assigned agent + all admins
    const usersToNotify = new Set<string>()
    if (final_assigned_to) usersToNotify.add(final_assigned_to)
    if (admins) admins.forEach(admin => usersToNotify.add(admin.id))

    if (usersToNotify.size > 0) {
      // Create notification payloads
      const notifications = Array.from(usersToNotify).map(userId => ({
        agency_id,
        user_id: userId,
        type: 'new_client',
        title: 'New Lead Captured!',
        message: `${full_name} is looking to ${looking_for}. Budget: ₹${budget_min} - ₹${budget_max}.`,
        reference_id: lead.id,
        reference_type: 'client',
        is_read: false
      }))

      // Insert notifications
      await supabaseAdmin.from('notifications').insert(notifications)
    }

    return NextResponse.json(
      { success: true, message: 'Lead captured successfully', leadId: lead.id },
      { status: 201 }
    )

  } catch (err: any) {
    console.error('API Exception:', err)
    return NextResponse.json(
      { error: 'Invalid request payload.' },
      { status: 400 }
    )
  }
}
