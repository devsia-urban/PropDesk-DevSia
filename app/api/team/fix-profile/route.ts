import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if profile exists
    const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('id', user.id).single()
    if (existing) return NextResponse.json({ success: true })

    // Force insert bypassing RLS
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'Team Member',
      agency_id: user.user_metadata?.agency_id,
      role: user.user_metadata?.role || 'agent'
    });
    if (insertError) throw insertError;
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[fix-profile] Error:', err.message)
    return NextResponse.json({ error: 'Failed to fix profile' }, { status: 500 })
  }
}
