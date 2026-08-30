import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (!process.env.ENTERPRISE_API_KEY) {
    return NextResponse.json({ error: 'API not configured on server' }, { status: 501 })
  }
  
  if (authHeader !== `Bearer ${process.env.ENTERPRISE_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit')) || 50
  
  // Clients table is used for leads
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    count: data.length,
    data
  })
}

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
      full_name,
      mobile_number,
      whatsapp_number,
      looking_for, // equivalent to purpose or property types
      preferred_location,
      budget, // maps to budget_min / budget_max based on parsing if needed
      budget_min,
      budget_max,
      purpose,
      possession_timeline,
      ready_for_site_visit,
      preferred_call_time,
      utm_source,
      utm_medium,
      utm_campaign,
      campaign_name,
      page_enquired,
      lead_score,
      agency_id
    } = body

    if (!full_name || !mobile_number || !agency_id) {
      return NextResponse.json({ error: 'full_name, mobile_number, and agency_id are required' }, { status: 400 })
    }

    // Assign to Admin fallback
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('role', 'admin')

    const assigned_to = admins && admins.length > 0 ? admins[0].id : null

    // Parse budget string if they pass the exact string from the website
    let bMin = budget_min || 0
    let bMax = budget_max || 0
    
    if (budget && !budget_min && !budget_max) {
      if (budget === 'Under ₹25L') bMax = 2500000
      else if (budget === '₹25–50L') { bMin = 2500000; bMax = 5000000 }
      else if (budget === '₹50L–₹1Cr') { bMin = 5000000; bMax = 10000000 }
      else if (budget === '₹1–2Cr') { bMin = 10000000; bMax = 20000000 }
      else if (budget === '₹2Cr+') { bMin = 20000000 }
    }

    const { data: lead, error } = await supabaseAdmin
      .from('clients')
      .insert({
        agency_id,
        full_name,
        phone: mobile_number,
        whatsapp_number: whatsapp_number || null,
        looking_for: purpose === 'Rental' ? 'rent' : 'buy',
        property_types: looking_for ? [looking_for.toLowerCase().replace(' / ', '_').replace(' ', '_')] : [],
        preferred_locations: preferred_location ? [preferred_location] : [],
        budget_min: bMin,
        budget_max: bMax,
        purpose: purpose || null,
        possession_timeline: possession_timeline || null,
        ready_for_site_visit: ready_for_site_visit || null,
        preferred_call_time: preferred_call_time || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        campaign_name: campaign_name || null,
        page_enquired: page_enquired || null,
        lead_score: lead_score || 0,
        assigned_to: assigned_to,
        assigned_at: assigned_to ? new Date().toISOString() : null,
        status: 'active',
        priority: 'high',
        source: utm_source || 'website'
      })
      .select()
      .single()

    if (error) throw error

    // Notifications
    if (assigned_to) {
      await supabaseAdmin.from('notifications').insert({
        agency_id,
        user_id: assigned_to,
        type: 'new_client',
        title: 'New Web Lead Captured!',
        message: `${full_name} enquired via ${utm_source || 'Website'}.`,
        reference_id: lead.id,
        reference_type: 'client',
        is_read: false
      })
    }

    return NextResponse.json({ success: true, lead_id: lead.id })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
