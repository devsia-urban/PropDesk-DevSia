/**
 * PropDesk Authentication Flow:
 * 1. Login: User enters credentials -> supabase.auth.signInWithPassword()
 * 2. Session: @supabase/ssr sets httpOnly cookies (access_token, refresh_token)
 * 3. Middleware: On every request, it reads/refreshes the session via supabase.auth.getUser()
 * 4. Protection: Logic ensures unauthenticated users can only see public/auth routes.
 * 5. Dashboard: AuthProvider (lib/context/auth-context.tsx) provides client-side user/profile state.
 */

import { updateSession } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function proxy(request: NextRequest) {
  // 1. Refresh/Get Session
  const response = await updateSession(request)

  // 2. Setup supabase server client to check session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 3. Define route groups
  const protectedRoutes = ['/dashboard', '/properties', '/clients', '/matches', '/notifications', '/team', '/settings']
  const authRoutes = ['/login', '/forgot-password']

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // 4. Redirect Logic
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 5. Scaling Security: Active Status & Role Protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, role, is_super_admin, agency_id')
      .eq('id', user.id)
      .single()

    // Real-time access revocation (Kill-Switch)
    if (profile && !profile.is_active && !pathname.startsWith('/login')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_deactivated', request.url))
    }

    // 🔒 AGENCY LOCK: Users must be bound to an agency to access the platform
    if (isProtectedRoute && !profile?.is_super_admin && !profile?.agency_id) {
       // This handles the edge case where a user exists but isn't linked yet
       if (pathname !== '/dashboard') {
         return NextResponse.redirect(new URL('/dashboard', request.url))
       }
    }

    // 🛡️ ROLE PROTECTION: Define strict boundaries
    const adminOnlyRoutes = ['/team', '/brokers', '/superadmin', '/api/admin']
    const isTryingAdmin = adminOnlyRoutes.some(route => pathname.startsWith(route))
    
    if (isTryingAdmin && profile?.role !== 'admin' && !profile?.is_super_admin) {
      console.warn(`[SECURITY] Blocked non-admin from ${pathname}`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Prevent logged-in users from seeing auth pages
    if (isAuthRoute || (pathname === '/' && user)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
