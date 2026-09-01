import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { requireProfile } from '@/lib/auth/get-session'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile()

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can resend invites' }, { status: 403 })
    }

    const { email, origin: clientOrigin } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { protocol, host } = new URL(req.url)
    const origin = clientOrigin || `${protocol}//${host}`

    // For users who are already registered but didn't finish onboarding, 
    // sending a password recovery email serves as the perfect "Reset / Setup Account" link.
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/update-password`
      }
    })

    if (error) {
       // If recovery fails, fallback to standard invite if they somehow got deleted
       const inviteRes = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
         redirectTo: `${origin}/accept-invite`
       })
       if (inviteRes.error) {
         return NextResponse.json({ error: inviteRes.error.message }, { status: 500 })
       }
    } else {
      // The generateLink admin method just creates the link, we must manually email it,
      // OR we can just use the standard client auth to trigger the email automatically:
      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`
      })
      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: `Recovery/Invite link sent to ${email}` })
  } catch (err) {
    console.error('[resend-invite] error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
