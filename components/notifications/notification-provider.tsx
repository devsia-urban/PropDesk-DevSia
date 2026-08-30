'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications'
import { Notification } from '@/lib/types/database'
import { toast } from 'sonner'
import { PushNotifications } from '@capacitor/push-notifications'

// Detect if we are running in a native mobile environment
const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()

interface NotificationsContextValue {
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  subscribeToPush: () => Promise<void>
  isSubscribed: boolean
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  setNotifications: () => {},
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  subscribeToPush: async () => {},
  isSubscribed: false,
})

export function useNotifications() {
  return useContext(NotificationsContext)
}

import { useFollowUpScheduler } from '@/lib/hooks/use-follow-up-scheduler'
import { NotificationPopup } from './notification-popup'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  
  // 🎯 Auto-schedule client follow-up reminders (8 AM, 1h before, Exact time)
  useFollowUpScheduler(profile?.id)

  const { notifications, setNotifications, unreadCount, markRead, markAllRead } =
    useRealtimeNotifications(profile?.id, [], 0)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentPopup, setCurrentPopup] = useState<Notification | null>(null)
  const lastCountRef = useRef(unreadCount)
  const lastSyncRef = useRef<string | null>(null)

  // 🔔 Trigger Custom Popup on New Notification
  useEffect(() => {
    // Only trigger if count increased (new notification arrived)
    if (unreadCount > lastCountRef.current) {
      const latest = notifications[0]
      if (latest) {
        // Show the popup
        setCurrentPopup(latest)
      }
    }
    lastCountRef.current = unreadCount
  }, [unreadCount, notifications])

  // 📱 Native Android Push Registration
  useEffect(() => {
    if (!isNative || !profile?.id) return


    async function setupNativePush() {
      try {
        console.log('Starting Native Push Setup...')
        
        // Request permissions
        const permStatus = await PushNotifications.requestPermissions()
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.requestPermissions()
        
        console.log('Permission Status:', permStatus.receive)

        if (permStatus.receive === 'granted') {
          // Wrap register in a try-catch to catch the 'Firebase not initialized' crash
          try {
            await PushNotifications.register()
            setIsSubscribed(true)
          } catch (registerError) {
            console.error('Firebase/Register Error:', registerError)
            toast.error('Mobile Alerts Inactive', { 
              description: 'Push notifications are disabled. Please ensure google-services.json is included in the build.' 
            })
          }
        }

        // Listen for token registration
        PushNotifications.addListener('registration', async (token) => {
          console.log('Native token registered:', token.value)
          const currentUserId = profile?.id
          if (!currentUserId) return

          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              token: token.value, 
              deviceType: 'android',
              userId: currentUserId
          }),
        })
        setIsSubscribed(true)
      })

        // Listen for errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error)
        })

        // Listen for incoming notifications while app is open
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          toast.success(notification.title || 'New Notification', {
            description: notification.body
          })
        })

        // 🔗 Listen for notification actions (Taps)
        PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
          const url = notification.data?.url
          if (url) {
            window.location.href = url
          }
        })

      } catch (err) {
        console.error('Native push setup failed:', err)
      }
    }

    setupNativePush()
    return () => {
      PushNotifications.removeAllListeners()
    }
  }, [profile?.id])

  // WebPush Registration Logic (Only for Browser)
  useEffect(() => {
    if (isNative || !profile?.id || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    // Don't re-sync if we already did it successfully for this user in this session
    if (lastSyncRef.current === profile.id) return

    async function registerPush() {
      if (isSyncing || !profile?.id) return
      setIsSyncing(true)

      try {
        // Only attempt if browser supports it and we have a session
        const registration = await navigator.serviceWorker.register('/sw.js').catch(err => {
           if (err.message?.includes('Failed to fetch')) return null
           throw err
        })
        
        if (!registration) return

        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription, deviceType: 'browser' }),
          }).catch(() => null) // Silence background fetch errors
          
          if (res?.ok) {
            setIsSubscribed(true)
            lastSyncRef.current = profile.id
          }
        }
      } catch (err) {
        // Silently fail for background sync to avoid console noise
      } finally {
        setIsSyncing(false)
      }
    }

    const timer = setTimeout(registerPush, 2000) // Delay sync to let page load finish
    return () => clearTimeout(timer)
  }, [profile?.id])

  // 🔔 Automatic Permission Request on Login
  useEffect(() => {
    if (!profile?.id || typeof window === 'undefined') return

    const hasAskedThisSession = sessionStorage.getItem(`asked_push_${profile.id}`)
    
    if (!hasAskedThisSession && 'Notification' in window && window.Notification.permission === 'default') {
      const autoAskTimer = setTimeout(() => {
        // We don't use toast here to avoid clutter, just trigger the native prompt
        subscribeToPush()
        sessionStorage.setItem(`asked_push_${profile.id}`, 'true')
      }, 3000) // Give them 3 seconds to look at the dashboard first
      return () => clearTimeout(autoAskTimer)
    }
  }, [profile?.id, isSubscribed])

  // Helper to request permission manually
  const subscribeToPush = async () => {
    if (!profile?.id || isSyncing) return
    
    setIsSyncing(true)
    const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!VAPID_KEY) {
      toast.error('Configuration Error', { description: 'Notification keys are missing in .env' })
      setIsSyncing(false)
      return
    }

    try {
      console.log('Push subscription started. Platform:', isNative ? 'Native' : 'Web')
      let permission: NotificationPermission | 'granted' | 'denied' | 'prompt'

      if (isNative) {
        // 📱 Native Android/iOS Flow
        const result = await PushNotifications.requestPermissions()
        permission = result.receive === 'granted' ? 'granted' : 'denied'
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        // 🌐 Web Browser Flow
        permission = await window.Notification.requestPermission()
      } else {
        console.warn('Notifications not supported on this platform/browser')
        setIsSyncing(false)
        return
      }

      if (permission !== 'granted') {
        toast.error('Permission Denied', { 
          description: 'Notifications are blocked by your browser. Click the lock icon in the URL bar to reset permissions.' 
        })
        setIsSyncing(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      // Clear old subscription and get a fresh one
      const oldSub = await registration.pushManager.getSubscription()
      if (oldSub) await oldSub.unsubscribe()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY
      })

      // Flip state immediately
      setIsSubscribed(true)
      lastSyncRef.current = profile.id

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, deviceType: 'browser' }),
      })

      if (res.ok) {
        setIsSubscribed(true)
        lastSyncRef.current = profile.id
        toast.success('Notifications Enabled', { description: 'You will now receive alerts even when the tab is closed.' })
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Server rejected subscription')
      }
    } catch (err: any) {
      console.error('Failed to subscribe:', err)
      toast.error('Subscription Failed', { description: err.message || 'Could not enable push notifications.' })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <NotificationsContext.Provider
      value={{ 
        notifications, 
        setNotifications, 
        unreadCount, 
        markRead, 
        markAllRead,
        subscribeToPush: profile?.id ? subscribeToPush : async () => {},
        isSubscribed
      }}
    >
      <NotificationPopup 
        notification={currentPopup} 
        onClose={() => setCurrentPopup(null)} 
      />
      {children}
    </NotificationsContext.Provider>
  )
}
