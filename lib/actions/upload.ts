'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Upload image using the authenticated user's own session.
 * No SERVICE_ROLE_KEY needed - the user's RLS policy already allows this.
 * RLS Policy: "images_upload" => bucket_id = 'property-images' AND auth.role() = 'authenticated'
 */
export async function uploadImageAction(formData: FormData) {
  try {
    // Use the user's own authenticated server session
    const supabase = await createClient()

    // Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { url: null, error: 'Not authenticated. Please log in again.' }
    }

    const file = formData.get('file') as File
    if (!file || file.size === 0) {
      return { url: null, error: 'No file provided' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = file.type.includes('png') ? 'png' : 'jpg'
    const fileName = `${user.id.slice(0, 8)}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', uploadError.message, uploadError)
      return { url: null, error: `Storage error: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName)

    // // console.log('[Upload] Success:', publicUrl)
    return { url: publicUrl, error: null }
  } catch (err: any) {
    console.error('[Upload] Unexpected error:', err)
    return { url: null, error: err.message || 'Upload failed unexpectedly' }
  }
}
