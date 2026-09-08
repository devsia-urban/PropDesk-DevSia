import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  // Protect with a static API key for Enterprise builds
  if (!process.env.ENTERPRISE_API_KEY) {
    return NextResponse.json({ error: 'API not configured on server' }, { status: 501 })
  }
  
  if (authHeader !== `Bearer ${process.env.ENTERPRISE_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role for backend API extraction
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit')) || 50
  const status = url.searchParams.get('status') || 'available'
  
  // Setup query
  let query = supabase
    .from('properties')
    .select('*')
    .eq('status', status)

  // Filtering
  const property_type = url.searchParams.get('property_type')
  if (property_type) query = query.eq('property_type', property_type)

  const listing_type = url.searchParams.get('listing_type')
  if (listing_type) query = query.eq('listing_type', listing_type)

  const city = url.searchParams.get('city')
  if (city) query = query.ilike('city', `%${city}%`)

  const locality = url.searchParams.get('locality')
  if (locality) query = query.ilike('locality', `%${locality}%`)

  const min_price = url.searchParams.get('min_price')
  if (min_price) query = query.gte('price', Number(min_price))

  const max_price = url.searchParams.get('max_price')
  if (max_price) query = query.lte('price', Number(max_price))

  const group = url.searchParams.get('group')
  if (group) query = query.eq('group', group)

  // General Text Search (searches title or description)
  const search = url.searchParams.get('search')
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Execute
  const { data, error } = await query
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
