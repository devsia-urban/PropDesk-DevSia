import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendUserNotification, notifyAgencyAdmins } from '@/lib/services/notification'
import { releaseExpiredHolds } from '@/lib/actions/bookings'

/**
 * PERIODIC CRON: Follow-up Reminders
 * Triggered by cron-job.org every 15 minutes.
 * Sends exactly 2 notifications per meeting:
 *   1. "Meeting Reminder" — 1 hour before
 *   2. "Meeting Now" — at the scheduled time
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Auto-release expired property holds
    await releaseExpiredHolds()

    const windowStart = new Date(now.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000)

    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select(`
        id, full_name, agency_id, assigned_to, created_by, follow_up_date,
        assignee:profiles!assigned_to(full_name),
        creator:profiles!created_by(full_name)
      `)
      .gte('follow_up_date', windowStart.toISOString())
      .lte('follow_up_date', windowEnd.toISOString())
      .eq('is_deleted', false)
      .neq('status', 'closed')

    if (error) {
      console.error('[cron-followups] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!clients?.length) {
      return NextResponse.json({ message: 'No upcoming follow-ups' })
    }

    let processedCount = 0

    for (const client of clients) {
      const followUpTime = new Date(client.follow_up_date)
      const diffMins = Math.round((followUpTime.getTime() - now.getTime()) / 60000)

      // Format time in IST (UTC+5:30)
      const istTime = new Date(followUpTime.getTime() + 5.5 * 60 * 60 * 1000)
      const hours = istTime.getUTCHours()
      const mins = istTime.getUTCMinutes()
      const ampm = hours >= 12 ? 'pm' : 'am'
      const displayHour = hours % 12 || 12
      const timeStr = `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`

      // Determine which notification to send
      let tag: 'reminder' | 'now' | null = null
      if (diffMins >= 45 && diffMins <= 75) {
        tag = 'reminder'
      } else if (diffMins >= -15 && diffMins <= 15) {
        tag = 'now'
      }

      if (!tag) continue

      const agentId = client.assigned_to || client.created_by
      const agentName = (client as any).assignee?.full_name || (client as any).creator?.full_name || 'Team'
      if (!agentId) continue

      // Stable titles for dedup (these NEVER change)
      const title = tag === 'reminder' ? '🕐 Meeting Reminder' : '📍 Meeting Now'
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()

      // DEDUP: Check if this exact title was already sent for this client
      const { data: alreadySent } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', agentId)
        .eq('reference_id', client.id)
        .eq('title', title)
        .gte('created_at', sixHoursAgo)
        .limit(1)

      if (alreadySent && alreadySent.length > 0) continue

      // --- Messages ---
      const agentMessage = tag === 'reminder'
        ? `You have a meeting with ${client.full_name} in 1 hour at ${timeStr}.`
        : `Time to meet ${client.full_name}! Your meeting is at ${timeStr}.`

      const adminMessage = tag === 'reminder'
        ? `${agentName} has a meeting with ${client.full_name} in 1 hour at ${timeStr}.`
        : `${agentName}'s meeting with ${client.full_name} is starting now (${timeStr}).`

      // Send to Agent (type: 'system' — valid DB enum)
      await sendUserNotification(agentId, client.agency_id, {
        type: 'system',
        title,
        message: agentMessage,
        referenceId: client.id,
        referenceType: 'client'
      })

      // Send to Admin(s)
      await notifyAgencyAdmins(client.agency_id, {
        type: 'system',
        title,
        message: adminMessage,
        referenceId: client.id,
        referenceType: 'client'
      }, agentId)

      processedCount++
    }

    return NextResponse.json({
      success: true,
      count: processedCount,
      message: `Processed ${processedCount} notifications`
    })
  } catch (err) {
    console.error('[cron-followups] error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
