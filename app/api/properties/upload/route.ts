import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'

export async function POST(req: Request) {
  try {
    const profile = await requireProfile()
    const supabase = await createClient()
    const formData = await req.formData()
    
    const files = formData.getAll('file') as File[]
    const propertyId = (formData.get('propertyId') as string) || 'temp'
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const path = `${profile.agency_id}/${propertyId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(path, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(path)

      return publicUrl
    })

    const urls = await Promise.all(uploadPromises)
    return NextResponse.json({ 
      urls,
      url: urls[0] // Helper for single file uploads
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
