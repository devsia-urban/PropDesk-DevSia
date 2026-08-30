'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export async function uploadPropertyImage(file: File, propertyId: string) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const path = `${profile.agency_id}/${propertyId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(path, file)

  if (error) {
    throw new Error(error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(path)

  return publicUrl
}
