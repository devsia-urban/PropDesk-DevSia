'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Client } from '@/lib/types/database'

const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()

export function useFollowUpScheduler(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !isNative) return

    async function scheduleNotifications() {
      const supabase = createClient()
      const now = new Date()
      
      // 1. Get all upcoming follow-ups for this user
      const todayDate = new Date().toISOString().split('T')[0]
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_to', userId)
        .eq('is_deleted', false)
        .gte('follow_up_date', todayDate)
        .not('follow_up_date', 'is', null)

      if (!clients?.length) return

      // 2. Clear previous scheduled notifications to avoid duplicates
      await LocalNotifications.cancel({ notifications: await LocalNotifications.getPending().then(p => p.notifications) })

      const notificationsToSchedule: any[] = []

      // Reminder 1: 8:00 AM Daily Summary (Consolidated)
      const morningClients = clients.filter((c: Client) => {
        if (!c.follow_up_date) return false
        const rem = new Date(c.follow_up_date)
        rem.setHours(8, 0, 0, 0)
        return rem > now
      })

      if (morningClients.length > 0) {
        const morningDate = new Date()
        morningDate.setHours(8, 0, 0, 0)
        if (morningDate > now) {
          notificationsToSchedule.push({
            id: 8000,
            title: '🌅 Today\'s Schedule',
            body: morningClients.length === 1 
              ? `You have a follow-up scheduled today with ${morningClients[0].full_name}.`
              : `You have follow-ups with ${morningClients.length} clients today.`,
            schedule: { at: morningDate },
            sound: 'default'
          })
        }
      }

      clients.forEach((client: Client) => {
        if (!client.follow_up_date) return
        const followUpDate = new Date(client.follow_up_date)

        // Reminder 2: 1 Hour Before - Get ready alert with client name
        const hourBeforeRem = new Date(followUpDate)
        hourBeforeRem.setHours(hourBeforeRem.getHours() - 1)
        if (hourBeforeRem > now) {
          notificationsToSchedule.push({
            id: Math.abs(hashCode(client.id + 'hour')),
            title: '⏰ Get Ready Alert',
            body: `You have a meeting with ${client.full_name} in 1 hour.`,
            schedule: { at: hourBeforeRem },
            sound: 'default'
          })
        }

        // Reminder 3: Exact Time - The moment of action
        if (followUpDate > now) {
          notificationsToSchedule.push({
            id: Math.abs(hashCode(client.id + 'now')),
            title: '🚀 The Moment of Action',
            body: `Time to call ${client.full_name}! Check your notes and start the call.`,
            schedule: { at: followUpDate },
            sound: 'default',
            extra: { clientId: client.id }
          })
        }
      })

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule })
        console.log(`[Scheduler] Queued ${notificationsToSchedule.length} reminders.`)
      }
    }

    scheduleNotifications()
  }, [userId])
}

// Simple hash helper to generate unique numeric IDs for notifications
function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
