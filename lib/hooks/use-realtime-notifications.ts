/**
 * Real-time notifications hook via Supabase Realtime.
 *
 * SETUP REQUIRED:
 * In Supabase dashboard → Database → Replication → enable the `notifications`
 * table for INSERT events (Publication: supabase_realtime).
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types/database'
import { type RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/matches'

export function useRealtimeNotifications(
  userId: string | undefined,
  initialNotifications: Notification[] = [],
  initialUnread: number = 0,
  onNewNotification?: (notification: Notification) => void
) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnread)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const newNotif = payload.new
          if (onNewNotification) onNewNotification(newNotif)
          setNotifications(prev => [newNotif, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    await markNotificationRead(id)
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await markAllNotificationsRead()
  }, [])

  return { notifications, setNotifications, unreadCount, markRead, markAllRead }
}
