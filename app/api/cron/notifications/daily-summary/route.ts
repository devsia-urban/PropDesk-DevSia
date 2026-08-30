import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendUserNotification, notifyAgencyAdmins } from '@/lib/services/notification'

/**
 * DAILY CRON: Morning Briefing (8 AM IST)
 * Sends a friendly summary of today's meetings to each agent and admin.
 * Path: /api/cron/notifications/daily-summary
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range in IST (UTC+5:30)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffset)
    
    // Start of today IST
    const todayStart = new Date(istNow)
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStartUTC = new Date(todayStart.getTime() - istOffset)
    
    // End of today IST
    const todayEnd = new Date(istNow)
    todayEnd.setUTCHours(23, 59, 59, 999)
    const todayEndUTC = new Date(todayEnd.getTime() - istOffset)

    // Fetch all today's follow-ups across all agencies
    const { data: todaysFollowUps, error } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        full_name,
        agency_id,
        assigned_to,
        created_by,
        follow_up_date,
        assignee:profiles!assigned_to(full_name),
        creator:profiles!created_by(full_name)
      `)
      .gte('follow_up_date', todayStartUTC.toISOString())
      .lte('follow_up_date', todayEndUTC.toISOString())
      .eq('is_deleted', false)
      .neq('status', 'closed')

    if (error) {
      console.error('[daily-summary] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!todaysFollowUps?.length) {
      return NextResponse.json({ message: 'No meetings today' })
    }

    // Group follow-ups by agency, then by agent
    const agencyMap = new Map<string, typeof todaysFollowUps>()
    for (const fu of todaysFollowUps) {
      const existing = agencyMap.get(fu.agency_id) || []
      existing.push(fu)
      agencyMap.set(fu.agency_id, existing)
    }

    let processedCount = 0
    const dedupeKey = `daily-summary-${istNow.toISOString().split('T')[0]}`

    for (const [agencyId, followUps] of agencyMap) {
      // Group by agent within this agency
      const agentMap = new Map<string, typeof followUps>()
      for (const fu of followUps) {
        const agentId = fu.assigned_to || fu.created_by
        if (!agentId) continue
        const existing = agentMap.get(agentId) || []
        existing.push(fu)
        agentMap.set(agentId, existing)
      }

      // Notify each Agent
      for (const [agentId, agentFollowUps] of agentMap) {
        // Check if already sent today
        const { data: existing } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', agentId)
          .eq('title', '☀️ Good Morning!')
          .gte('created_at', todayStartUTC.toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        const count = agentFollowUps.length
        const clientNames = agentFollowUps
          .map(fu => fu.full_name)
          .slice(0, 3)
          .join(', ')
        const extra = count > 3 ? ` and ${count - 3} more` : ''

        await sendUserNotification(agentId, agencyId, {
          type: 'system',
          title: '☀️ Good Morning!',
          message: `You have ${count} meeting${count > 1 ? 's' : ''} today — ${clientNames}${extra}. Have a great day!`,
          referenceId: agentFollowUps[0].id,
          referenceType: 'client'
        })
        processedCount++
      }

      // Notify Admins with a team-wide summary
      const totalMeetings = followUps.length
      const totalAgents = agentMap.size

      // Build a quick breakdown
      const breakdown = Array.from(agentMap.entries())
        .slice(0, 4)
        .map(([, fus]) => {
          const name = (fus[0] as any).assignee?.full_name || (fus[0] as any).creator?.full_name || 'Agent'
          return `${name} (${fus.length})`
        })
        .join(', ')
      const extraAgents = totalAgents > 4 ? ` +${totalAgents - 4} more` : ''

      await notifyAgencyAdmins(agencyId, {
        type: 'system',
        title: '☀️ Good Morning!',
        message: `${totalMeetings} meeting${totalMeetings > 1 ? 's' : ''} scheduled today with ${totalAgents} agent${totalAgents > 1 ? 's' : ''} — ${breakdown}${extraAgents}. Have a productive day!`,
        referenceId: followUps[0].id,
        referenceType: 'client'
      })
      processedCount++
    }

    return NextResponse.json({
      success: true,
      count: processedCount,
      message: `Sent ${processedCount} morning briefings`
    })
  } catch (err) {
    console.error('[daily-summary] error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
