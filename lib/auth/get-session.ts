import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { type Profile } from '@/lib/types/database'

export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return null
  return session
})

export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
})

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export const getProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()

  // Fetch profile joined with agency subscription info
  // Using a more resilient approach to handle missing columns during migrations
  const { data: rawData, error } = await supabase
    .from('profiles')
    .select('*, agencies(subscription_status, subscription_end_date, plan_type)')
    .eq('id', user.id)
    .limit(1)
    
  const data = rawData?.[0] || null

  if (!data) {
    console.error('Database Profile Fetch Error: No profile found in the database for this user.')
    return null
  }

  if (error) {
    console.error('Database Profile Fetch Error:', error.message)
    return null
  }

  // Flatten the agency data for easier access
  const agency = (data as any).agencies

  // Safety check for super admin
  const isSuperAdmin = (data as any).is_super_admin

  // Dynamic Expire Logic: Automatically expire if the end date has passed
  let effectiveStatus = agency?.subscription_status || (isSuperAdmin ? 'active' : 'trial');
  // console.log(`[getProfile] User: ${user.id}, DB Status: ${agency?.subscription_status}, EndDate: ${agency?.subscription_end_date}`);

  if (!isSuperAdmin && agency?.subscription_end_date) {
    const endDate = new Date(agency.subscription_end_date);
    // Add 1 day grace period so it expires at the END of the day
    endDate.setDate(endDate.getDate() + 1);

    // console.log(`[getProfile] Now: ${new Date().toISOString()}, EndDate (+1 day): ${endDate.toISOString()}`);
    if (new Date() > endDate && effectiveStatus !== 'paused') {
      // console.log(`[getProfile] Overwriting status to expired`);
      effectiveStatus = 'expired';
    }
  }

  // console.log(`[getProfile] Final effectiveStatus: ${effectiveStatus}`);

  const profile = {
    ...data,
    subscription_status: effectiveStatus,
    subscription_end_date: agency?.subscription_end_date || null,
    plan_type: agency?.plan_type || (isSuperAdmin ? 'pro' : 'free'),
    is_super_admin: isSuperAdmin
  }

  return profile as Profile & {
    subscription_status: string,
    subscription_end_date: string,
    plan_type: string
  }
})

import { headers } from 'next/headers'

export async function requireProfile() {
  const user = await getUser()
  const headerList = await headers()
  const isApiRequest = headerList.get('accept')?.includes('json') || headerList.get('content-type')?.includes('json')

  if (!user) {
    if (isApiRequest) {
      throw new Error('UNAUTHORIZED')
    }
    redirect('/login')
  }

  const profile = await getProfile()

  if (!profile) {
    if (isApiRequest) {
      throw new Error('PROFILE_MISSING')
    }
    // Break the loop: If user is logged in but profile is missing, 
    // don't redirect to /login (which redirects back to /dashboard).
    // Instead, send them to the setup/invite acceptance page.
    redirect('/accept-invite#syncing=true')
  }

  // 🔒 ACCESS CONTROL: Strict check for deactivated or removed members
  if (!profile.is_active || (!profile.agency_id && !profile.is_super_admin)) {
    if (isApiRequest) {
      throw new Error('ACCESS_REVOKED')
    }
    // Redirect to login with a clear message
    redirect('/login?error=Your access has been revoked or your account is deactivated.')
  }

  // Super Admin Bypass
  if (profile.is_super_admin) return profile

  // Subscription Locking
  if (profile.subscription_status === 'expired') {
    if (isApiRequest) throw new Error('SUBSCRIPTION_EXPIRED')
    redirect('/subscription-expired')
  }

  return profile
}

export async function requireSuperAdmin() {
  const profile = await requireProfile()
  if (!profile.is_super_admin) {
    redirect('/dashboard')
  }
  return profile
}
