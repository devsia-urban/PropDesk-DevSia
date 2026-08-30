'use server'

import { createClient } from "@/lib/supabase/server"
import { requireProfile } from "@/lib/auth/get-session"
import { revalidatePath } from "next/cache"
import { Agency } from "@/lib/types/database"

export async function updateAgencyBranding(formData: Partial<Agency>) {
  const profile = await requireProfile()

  if (profile.role !== 'admin') {
    return { error: "Permission denied. Only admins can update branding." }
  }

  if (!profile.agency_id) {
    return { error: "Your profile is not linked to an agency. Please contact support." }
  }

  const supabase = await createClient()
  // console.log(`[BRANDING_DEBUG] Attempting update for Agency ID: ${profile.agency_id}`)

  const { data, error } = await supabase
    .from('agencies')
    .update({
      name: formData.name,
      logo_url: formData.logo_url,
      website: formData.website,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      address: formData.address,
      facebook_url: formData.facebook_url,
      instagram_url: formData.instagram_url,
      linkedin_url: formData.linkedin_url,
      twitter_url: formData.twitter_url,
    })
    .eq('id', profile.agency_id)
    .select()

  if (error) {
    console.error("Update Agency Error:", error)
    return { error: "Failed to update branding. Please try again." }
  }

  if (!data || data.length === 0) {
    return { error: "Agency not found. Your profile might be misconfigured." }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/')

  return { data: data[0] as Agency }
}

export async function getAgency() {
  const profile = await requireProfile()
  if (!profile.agency_id) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', profile.agency_id)
    .single()

  if (error) return null
  return data as Agency
}
