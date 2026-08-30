import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (!process.env.ENTERPRISE_API_KEY) {
    return NextResponse.json({ error: 'API not configured on server' }, { status: 501 })
  }
  
  if (authHeader !== `Bearer ${process.env.ENTERPRISE_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const {
      agency_id,
      full_name,
      mobile_number,
      whatsapp_number,
      email,
      city,
      experience_level,
      property_types, // expects array or comma separated string
      preferred_working_location,
      current_occupation,
      works_with_other_company, // "Yes" or "No" or boolean
      deals_closed_last_year
    } = body

    if (!full_name || !mobile_number || !agency_id) {
      return NextResponse.json({ error: 'full_name, mobile_number, and agency_id are required' }, { status: 400 })
    }

    // Parse works_with_other_company
    let works_with = false
    if (typeof works_with_other_company === 'boolean') {
      works_with = works_with_other_company
    } else if (typeof works_with_other_company === 'string') {
      works_with = works_with_other_company.toLowerCase() === 'yes'
    }

    // Parse property types
    let parsedTypes: string[] = []
    if (Array.isArray(property_types)) {
      parsedTypes = property_types
    } else if (typeof property_types === 'string') {
      parsedTypes = property_types.split(',').map(s => s.trim())
    }

    const { data: application, error } = await supabaseAdmin
      .from('associate_applications')
      .insert({
        agency_id,
        full_name,
        mobile_number,
        whatsapp_number: whatsapp_number || null,
        email: email || null,
        city: city || null,
        experience_level: experience_level || null,
        property_types: parsedTypes,
        preferred_working_location: preferred_working_location || null,
        current_occupation: current_occupation || null,
        works_with_other_company: works_with,
        deals_closed_last_year: deals_closed_last_year || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Notify Admins
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        agency_id,
        user_id: admin.id,
        type: 'system',
        title: 'New Associate Application',
        message: `${full_name} applied to be an associate from your website.`,
        reference_id: application.id,
        reference_type: 'associate_application',
        is_read: false
      }))
      await supabaseAdmin.from('notifications').insert(notifications)
    }

    return NextResponse.json({ success: true, application_id: application.id })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
