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
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', status)
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
