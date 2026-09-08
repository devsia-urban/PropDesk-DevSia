'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyAgencyAdmins } from '@/lib/services/notification'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export async function getAssociates() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('associate_applications')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAssociates error:', error)
    throw new Error(`Failed to fetch associates: ${error.message}`)
  }

  return data
}

export async function updateAssociateStatus(id: string, status: 'approved' | 'rejected') {
  const profile = await requireProfile()
  if (profile.role !== 'admin') throw new Error('Unauthorized')

  const supabase = await createClient()

  // 1. Update the application status
  const { data: application, error: updateError } = await supabase
    .from('associate_applications')
    .update({ status })
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .select()
    .single()

  if (updateError) throw new Error(`Failed to update status: ${updateError.message}`)

  // 2. If approved, optionally do something else (e.g. create a broker profile)
  // For now, we just update the status so the UI reflects it!

  return { success: true, application }
}

export async function submitAssociateApplication(formData: any) {
  
  // Check for duplicate mobile number
  const { data: existingApp } = await supabaseAdmin
    .from('associate_applications')
    .select('id')
    .eq('agency_id', formData.agency_id)
    .eq('mobile_number', formData.mobile_number)
    .single()

  if (existingApp) {
    return { error: 'An application with this mobile number has already been submitted.' }
  }

  // Use supabaseAdmin to bypass RLS since the user is not authenticated

  const { data: app, error } = await supabaseAdmin
    .from('associate_applications')
    .insert({
      agency_id: formData.agency_id,
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      whatsapp_number: formData.whatsapp_number,
      email: formData.email,
      city: formData.city,
      experience_level: formData.experience_level,
      property_types: formData.property_types,
      preferred_working_location: formData.preferred_working_location,
      current_occupation: formData.current_occupation,
      works_with_other_company: formData.works_with_other_company,
      deals_closed_last_year: formData.deals_closed_last_year,
      other_company_name: formData.other_company_name,
      status: 'pending'
    })
    .select()
    .single()

  if (error || !app) {
    console.error('submitAssociateApplication error:', error)
    return { error: error?.message || 'Failed to submit application' }
  }

  // 🔔 Trigger Notification to Admins
  await notifyAgencyAdmins(formData.agency_id, {
    type: 'system',
    title: '👋 New Associate Application',
    message: `${formData.full_name} has applied to join as an Associate. Tap to review.`,
    referenceId: app.id,
    referenceType: 'associate' // Or 'application' depending on your frontend logic
  })

  return { data: app }
}
