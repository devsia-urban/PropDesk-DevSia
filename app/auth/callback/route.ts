import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // 1. Check if we already have a session (handles "code already consumed" if user is already logged in)
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 2. Exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Log error for debugging but don't leak details to URL
    console.error('Auth Callback Error:', error.message)
    
    // Optional: If error is "code already used", try to get session one last time
    if (error.message.includes('already been used') || error.message.includes('expired')) {
       const { data: { session: finalSession } } = await supabase.auth.getSession()
       if (finalSession) return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 3. Return to login with clear user-facing error
  return NextResponse.redirect(`${origin}/login?error=Could not verify your access link. It may have expired or was already used.`)
}
