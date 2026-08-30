'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export async function getDefaultWhatsAppTemplate() {
  try {
    const profile = await requireProfile()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('agency_id', profile.agency_id)
      .eq('is_default', true)
      .single()

    if (error) {
      console.warn('No custom template found, using fallback')
      return null
    }

    return data.content
  } catch (error) {
    console.error('Error fetching template:', error)
    return null
  }
}
