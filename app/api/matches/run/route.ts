import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireProfile } from '@/lib/auth/get-session'
import { NextRequest, NextResponse } from 'next/server'
import { scoreMatch } from '@/lib/matching/score'
import { Client, Property } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireProfile()
    if (!profile.agency_id) {
      return NextResponse.json({ error: 'No agency linked' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { clientId, propertyId } = body

    const supabase = await createClient()

    // ── Fetch properties ───────────────────────────
    let propertyQuery = supabase
      .from('properties')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .eq('is_deleted', false)
      .eq('status', 'available')

    if (propertyId) {
      propertyQuery = propertyQuery.eq('id', propertyId)
    }

    const { data: properties, error: propError } = await propertyQuery

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 })
    }
    if (!properties || properties.length === 0) {
      return NextResponse.json({ success: true, totalMatches: 0, message: 'No available properties found' })
    }

    // ── Fetch clients ─────────────────────────────────────────
    let clientQuery = supabase
      .from('clients')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .eq('is_deleted', false)
      .neq('status', 'closed')

    if (clientId) {
      clientQuery = clientQuery.eq('id', clientId)
    }

    const { data: clients, error: clientError } = await clientQuery
    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 })
    }
    if (!clients || clients.length === 0) {
      return NextResponse.json({ success: true, totalMatches: 0, message: 'No active clients found' })
    }

    // ── Score every client × property pair ────────────────────
    const matchRows: {
      agency_id: string
      client_id: string
      property_id: string
      score: number
      score_breakdown: object
      status: string
    }[] = []

    for (const client of clients as Client[]) {
      for (const property of properties as Property[]) {
        const result = scoreMatch(client, property)
        // Only store matches that qualify
        if (result.qualifies) {
          matchRows.push({
            agency_id: profile.agency_id,
            client_id: client.id,
            property_id: property.id,
            score: result.score,
            score_breakdown: result.breakdown,
            status: 'new',
          })
        }
      }
    }

    if (matchRows.length === 0) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        clientsProcessed: clients.length,
        message: 'No matches found — check client budget/location requirements vs available properties'
      })
    }

    // ── Upsert matches (by client_id + property_id) ───────────
    const { error: upsertError } = await supabaseAdmin
      .from('matches')
      .upsert(matchRows, {
        onConflict: 'client_id,property_id',
        ignoreDuplicates: false,
      })

    if (upsertError) {
      // If upsert fails due to no unique constraint, try insert ignoring duplicates
      const { error: insertError } = await supabaseAdmin
        .from('matches')
        .insert(matchRows)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    // ── Create notifications for qualified matches ─────────────
    const qualifiedMatches = matchRows.filter(m => m.score >= 70) // only high confidence matches get notifications
    if (qualifiedMatches.length > 0) {
      const notifications = qualifiedMatches.slice(0, 20).map(m => ({
        agency_id: profile.agency_id!,
        user_id: profile.id,
        type: 'match_found' as const,
        title: 'New match found',
        message: `A property matched a client with a score of ${m.score}%`,
        reference_id: m.client_id,
        reference_type: 'client',
        is_read: false,
      }))

      await supabaseAdmin.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      success: true,
      clientsProcessed: clients.length,
      propertiesScored: properties.length,
      totalMatches: matchRows.length,
      qualifiedMatches: qualifiedMatches.length,
    })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized — Please sign in.' }, { status: 401 })
    }
    if (e.message === 'PROFILE_MISSING') {
      return NextResponse.json({ 
        error: 'Profile not ready', 
        message: 'Your profile is being synchronized. Please wait a moment.',
        isSyncing: true 
      }, { status: 403 })
    }
    if (e.message === 'SUBSCRIPTION_EXPIRED') {
      return NextResponse.json({ error: 'Subscription expired' }, { status: 402 })
    }
    
    console.error('[matches/run] error:', e)
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
