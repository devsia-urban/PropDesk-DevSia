'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireProfile } from '@/lib/auth/get-session'
import { MatchWithDetails, MatchStatus, Notification } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { formatDistanceToNow, startOfWeek } from 'date-fns'

export interface MatchFilters {
  minScore?: number
  status?: string
  search?: string
  sortBy?: string
  page?: number
}

// ── getMatches ──────────────────────────────────────────────
export async function getMatches(filters: MatchFilters = {}) {
  const profile = await requireProfile()
  const supabase = await createClient()

  const pageSize = 30
  const currentPage = filters.page || 1
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // console.log(`[DIAGNOSTIC] getMatches - User: ${profile.id}, Role: ${profile.role}`)

  let query = supabase
    .from('matches')
    .select(`
      *,
      client:clients!matches_client_id_fkey(*),
      property:properties!matches_property_id_fkey(*)
    `, { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .neq('status', 'dismissed')

  // 🛡️ Agent Privacy for Matches
  if (profile.role === 'agent') {
    // console.log(`[DIAGNOSTIC] Restricting matches to assigned clients for: ${profile.id}`)
    query = query.filter('client.assigned_to', 'eq', profile.id)
  }

  if (filters.minScore) {
    query = query.gte('score', filters.minScore)
  } else {
    // Default to 40% as requested after fuzzy logic update
    query = query.gte('score', 40)
  }

  if (filters.status && filters.status !== 'All' && filters.status !== 'all') {
    query = query.eq('status', filters.status.toLowerCase())
  }

  // Apply range and order
  const { data, error, count } = await query
    .order('score', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('getMatches error:', error)
    throw new Error(`Failed to fetch matches: ${error.message}`)
  }

  let results = (data || []) as unknown as MatchWithDetails[]

  // 🛡️ Extra Security Layer: Remove "Ghost" matches where client is null (hidden by RLS)
  results = results.filter(m => m.client !== null)

  // Search across client name and property title (Post-fetch filter for simplicity, 
  // or could be moved to SQL for better performance)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(m =>
      m.client?.full_name?.toLowerCase().includes(q) ||
      m.property?.title?.toLowerCase().includes(q) ||
      m.property?.city?.toLowerCase().includes(q)
    )
  }

  return {
    data: results,
    count: count || 0,
    page: currentPage,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// ── getMatchesForClient ─────────────────────────────────────
export async function getMatchesForClient(clientId: string): Promise<MatchWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`*, client:clients!matches_client_id_fkey(*), property:properties!matches_property_id_fkey(*)`)
    .eq('client_id', clientId)
    .neq('status', 'dismissed')
    .order('score', { ascending: false })

  if (error) return []
  return (data || []) as unknown as MatchWithDetails[]
}

// ── getMatchesForProperty ───────────────────────────────────
export async function getMatchesForProperty(propertyId: string): Promise<MatchWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`*, client:clients!matches_client_id_fkey(*), property:properties!matches_property_id_fkey(*)`)
    .eq('property_id', propertyId)
    .neq('status', 'dismissed')
    .order('score', { ascending: false })

  if (error) return []
  return (data || []) as unknown as MatchWithDetails[]
}

export async function getMatch(matchId: string): Promise<MatchWithDetails | null> {
  const profile = await requireProfile()
  const supabase = await createClient()

  // console.log(`[DIAGNOSTIC] getMatch - User: ${profile.id}, Role: ${profile.role}`)

  const { data, error } = await supabase
    .from('matches')
    .select(`*, client:clients!matches_client_id_fkey(*), property:properties!matches_property_id_fkey(*)`)
    .eq('id', matchId)
    .single()

  if (error || !data) return null

  const match = data as unknown as MatchWithDetails

  // 🛡️ Security Check for single match view
  if (profile.role === 'agent' && match.client?.assigned_to !== profile.id) {
    console.warn(`[SECURITY] Agent ${profile.id} tried to access unassigned match ${matchId}`)
    return null
  }

  return match
}

// ── updateMatchStatus ───────────────────────────────────────
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const profile = await requireProfile()

  const { error } = await supabaseAdmin
    .from('matches')
    .update({ status })
    .eq('id', matchId)
    .eq('agency_id', profile.agency_id)

  if (error) return { error: error.message }

  revalidatePath('/matches')
  revalidatePath(`/matches/${matchId}`)
  return { data: { success: true } }
}

// ── getDashboardStats ───────────────────────────────────────
export async function getDashboardStats() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const weekStart = startOfWeek(new Date()).toISOString()
  const isAgent = profile.role === 'agent'

  // console.log(`[DIAGNOSTIC] Dashboard Stats - User: ${profile.id}, Role: ${profile.role}, isAgent: ${isAgent}`)

  // 1. Properties (Always shared)
  const propQuery = supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)

  // 2. Clients (Role-aware)
  let clientQuery = supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)
    .eq('status', 'active')
  if (isAgent) clientQuery = clientQuery.eq('assigned_to', profile.id)

  // 3. Matches (Role-aware)
  let matchQuery = supabase
    .from('matches')
    .select('id, client:clients!inner(assigned_to)', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .gte('matched_at', weekStart)
    .gte('score', 50)

  if (isAgent) {
    matchQuery = matchQuery.eq('client.assigned_to', profile.id)
  }

  // 4. Follow-ups (Role-aware)
  let followQuery = supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('is_deleted', false)
    .eq('status', 'active')
    .lte('follow_up_date', new Date().toISOString().slice(0, 10))
    .not('follow_up_date', 'is', null)
  if (isAgent) followQuery = followQuery.eq('assigned_to', profile.id)

  // 5. Townships (Schemes)
  const schemeQuery = supabase
    .from('schemes')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)

  // 6. Available Plots (Units with status = 'available')
  const plotQuery = supabase
    .from('units')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('status', 'available')

  const [propertiesRes, clientsRes, matchesRes, followupsRes, schemesRes, plotsRes] = await Promise.all([
    propQuery,
    clientQuery,
    matchQuery,
    followQuery,
    schemeQuery,
    plotQuery
  ])

  return {
    properties: propertiesRes.count ?? 0,
    clients: clientsRes.count ?? 0,
    matchesThisWeek: matchesRes.count ?? 0,
    pendingFollowups: followupsRes.count ?? 0,
    townships: schemesRes.count ?? 0,
    availablePlots: plotsRes.count ?? 0,
  }
}

// ── getRecentNotifications ──────────────────────────────────
export async function getRecentNotifications(limit = 8): Promise<Notification[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data || []) as Notification[]
}

// ── getUnreadNotificationCount ──────────────────────────────
export async function getUnreadNotificationCount(): Promise<number> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  return count ?? 0
}

// ── markNotificationRead ────────────────────────────────────
export async function markNotificationRead(id: string) {
  const profile = await requireProfile()
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', profile.id)

  revalidatePath('/notifications')
  return { data: { success: true } }
}

// ── markAllNotificationsRead ────────────────────────────────
export async function markAllNotificationsRead() {
  const profile = await requireProfile()
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)

  revalidatePath('/notifications')
  return { data: { success: true } }
}

export async function ensureDailyFollowUpNotification(count: number) {
  if (count === 0) return

  const profile = await requireProfile()
  const supabase = await createClient()

  // Format YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0]

  // Check if we already inserted a follow-up notification today for this user
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', profile.id)
    .eq('type', 'system')
    .like('title', '%Follow-ups due%')
    .gte('created_at', `${todayDate}T00:00:00`)
    .limit(1)

  if (!data || data.length === 0) {
    try {
      await supabase.from('notifications').insert({
        agency_id: profile.agency_id,
        user_id: profile.id,
        type: 'system',
        title: 'Follow-ups due today',
        message: `You have ${count} client profile(s) needing contact today. Check your dashboard widget.`,
        is_read: false
      })
    } catch (e) { }
  }
}

export async function getHotMatches(limit = 3): Promise<MatchWithDetails[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  // console.log(`[DIAGNOSTIC] getHotMatches - User: ${profile.id}, Role: ${profile.role}`)

  let query = supabase
    .from('matches')
    .select(`
      *,
      client:clients!matches_client_id_fkey(*),
      property:properties!matches_property_id_fkey(*)
    `)
    .eq('agency_id', profile.agency_id)
    .neq('status', 'dismissed')
    .gte('score', 85)

  // 🛡️ Agent Privacy for Dashboard matches
  if (profile.role === 'agent') {
    query = query.filter('client.assigned_to', 'eq', profile.id)
  }

  const { data, error } = await query
    .order('score', { ascending: false })
    .limit(limit)

  if (error) return []

  // Post-fetch filter to remove ghost matches
  const results = (data || []) as unknown as MatchWithDetails[]
  return results.filter(m => m.client !== null)
}
