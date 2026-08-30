import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import admin from 'firebase-admin'

// Initialize WebPush with VAPID keys from environment
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@propdesk.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

// Initialize Firebase Admin once
if (!admin.apps.length) {
  try {
    // Strip surrounding quotes that .env files may add
    const rawAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '{}').replace(/^['"]|['"]$/g, '').trim()
    
    if (rawAccount && rawAccount !== 'FIREBASE_SERVICE_ACCOUNT' && rawAccount !== 'undefined' && rawAccount.startsWith('{')) {
      const serviceAccount = JSON.parse(rawAccount)
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
        console.log('[FCM] Firebase Admin Initialized for', serviceAccount.project_id)
      }
    } else if (rawAccount !== '{}') {
       console.warn('[FCM] Skipping: FIREBASE_SERVICE_ACCOUNT not configured.')
    }
  } catch (e) {
    console.error('[FCM] Initialization Error:', e)
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

/**
 * Sends a notification to a specific user.
 * 1. Inserts into DB for real-time in-app delivery.
 * 2. Sends WebPush to registered browsers/devices for background delivery.
 */
export async function sendUserNotification(
  userId: string,
  agencyId: string,
  data: {
    type: 'new_client' | 'match_found' | 'property_update' | 'team_member' | 'system' | string
    title: string
    message: string
    referenceId?: string
    referenceType?: string
  }
) {
  // 1. Save to Database for In-App Notifications
  const { data: notif, error: notifError } = await supabaseAdmin
    .from('notifications')
    .insert({
      agency_id: agencyId,
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      reference_id: data.referenceId,
      reference_type: data.referenceType,
      is_read: false
    })
    .select()
    .single()

  if (notifError) {
    console.error('Error creating in-app notification:', notifError)
    return null
  }

  // 2. Fetch Push Subscriptions for this user
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from('user_device_notifications')
    .select('endpoint, subscription_json, device_type')
    .eq('user_id', userId)

  if (subError || !subscriptions?.length) {
    return notif
  }

  // 3. Send Multi-Platform Payloads
    const pushPromises = subscriptions.map((sub: any) => {
      const url = data.referenceId ? `/${data.referenceType}s/${data.referenceId}` : '/dashboard'

    // --- BROWSER (WebPush) ---
    if (sub.device_type === 'browser') {
      const pushPayload = JSON.stringify({
        title: data.title,
        body: data.message,
        url,
        tag: data.type
      })
      return webpush.sendNotification(sub.subscription_json, pushPayload)
        .catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            return supabaseAdmin.from('user_device_notifications').delete().eq('endpoint', sub.endpoint)
          }
        })
    } 
    
    // --- ANDROID (FCM V1) ---
    if (sub.device_type === 'android' && admin.apps.length > 0) {
      return admin.messaging().send({
        token: sub.endpoint,
        notification: {
          title: data.title,
          body: data.message,
        },
        data: {
          url,
          type: data.type,
          referenceId: data.referenceId || ''
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            icon: 'fcm_push_icon',
            color: '#10b981', // Emerald green to match PropDesk
            sound: 'default'
          }
        }
      }).catch(err => {
        console.error('[FCM] Send Error:', err)
        if (err.code === 'messaging/registration-token-not-registered') {
          return supabaseAdmin.from('user_device_notifications').delete().eq('endpoint', sub.endpoint)
        }
      })
    } 
    
    return Promise.resolve() 
  })

  await Promise.all(pushPromises)
  return notif
}

/**
 * Notifies all admins in an agency
 */
export async function notifyAgencyAdmins(
  agencyId: string,
  data: {
    type: 'new_client' | 'match_found' | 'property_update' | 'team_member' | 'system'
    title: string
    message: string
    referenceId?: string
    referenceType?: string
  },
  excludeUserId?: string
) {
  // Find all admins for this agency
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('role', 'admin')
    .eq('is_active', true)

  if (!admins?.length) return

  const filteredAdmins = excludeUserId 
    ? admins.filter(admin => admin.id !== excludeUserId)
    : admins

  const promises = filteredAdmins.map(admin => sendUserNotification(admin.id, agencyId, data))
  await Promise.all(promises)
}
