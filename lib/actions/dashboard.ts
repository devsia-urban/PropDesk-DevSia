'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { getDashboardStats, getRecentNotifications, getHotMatches } from '@/lib/actions/matches'
import { getRecentActivities } from '@/lib/actions/activities'
import { getProperties } from '@/lib/actions/properties'
import { getUpcomingFollowUps, getOverdueFollowUps } from '@/lib/actions/clients'

export async function getDashboardData() {
  const profile = await requireProfile()
  
  // Automatically cleanup any expired holds before fetching stats
  const { checkAndReleaseExpiredHolds } = await import('@/lib/actions/bookings')
  await checkAndReleaseExpiredHolds().catch(console.error)

  // Fetch all heavy data blocks in parallel. This brings response time down from ~30s to ~3s.
  // IPv4 DNS resolution is now fixed on the server so parallel requests will not timeout.
  const [
    stats,
    notifications,
    recentActivities,
    recentProperties,
    followUps,
    overdueFollowUps,
    hotMatches
  ] = await Promise.all([
    getDashboardStats(),
    getRecentNotifications(3),
    getRecentActivities(4),
    getProperties({ limit: 6 } as any),
    getUpcomingFollowUps(),
    getOverdueFollowUps(),
    getHotMatches(2)
  ])

  return {
    profile,
    stats,
    notifications,
    recentActivities,
    recentProperties,
    followUps,
    overdueFollowUps,
    hotMatches
  }
}
