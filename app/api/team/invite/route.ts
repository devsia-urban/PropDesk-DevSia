import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { requireProfile } from '@/lib/auth/get-session'
import { UserRole } from '@/lib/types/database'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite team members' }, { status: 403 })
    }

    if (!profile.agency_id) {
      return NextResponse.json({ error: 'Your account is not linked to an agency' }, { status: 400 })
    }

    const body = await req.json()
    const { email, role } = body as { email: string; role: UserRole }

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    if (!['admin', 'agent', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { protocol, host } = new URL(req.url)
    const origin = `${protocol}//${host}`

    // Send magic-link invite via Supabase Admin
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        agency_id: profile.agency_id,
        role: role,
      },
      redirectTo: `${origin}/accept-invite`,
    })

    if (error) {
      if (error.message?.includes('already registered')) {
        return NextResponse.json({ error: 'This email is already registered. Ask them to log in.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: `Invite sent to ${email}`, userId: data.user?.id })
  } catch (err) {
    console.error('[invite] error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
