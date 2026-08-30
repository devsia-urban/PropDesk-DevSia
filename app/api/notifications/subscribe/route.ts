import { NextRequest, NextResponse } from 'next/server'
import { requireProfile } from '@/lib/auth/get-session'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    // console.log('[subscribe] Starting registration...')

    const profile = await requireProfile()
    // console.log(`[subscribe] Auth check took ${Date.now() - start}ms`)

    const { subscription, token, deviceType } = await req.json()

    // Android/Native sends a 'token', Web sends a 'subscription'
    const finalEndpoint = token || subscription?.endpoint
    
    if (!finalEndpoint) {
      return NextResponse.json({ error: 'Valid notification address (token or endpoint) is required' }, { status: 400 })
    }

    const dbStart = Date.now()
    const { error } = await supabaseAdmin
      .from('user_device_notifications')
      .upsert({
        user_id: profile.id,
        endpoint: finalEndpoint,
        subscription_json: subscription || { token }, // Store token as JSON fallback if no subscription
        device_type: deviceType || 'browser'
      }, {
        onConflict: 'endpoint'
      })

    // console.log(`[subscribe] DB operation took ${Date.now() - dbStart}ms`)

    if (error) {
      console.error('[subscribe] DB Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[subscribe] Unexpected error:', err.message)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile()
    const { subscription } = await req.json()

    const { error } = await supabaseAdmin
      .from('user_device_notifications')
      .delete()
      .eq('user_id', profile.id)
      .eq('subscription_json', subscription)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
