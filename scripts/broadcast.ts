import webpush from 'web-push'
import admin from 'firebase-admin'
import { supabaseAdmin } from '../lib/supabase/admin'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@propdesk.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

if (!admin.apps.length) {
  try {
    const rawAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '{}').replace(/^['"]|['"]$/g, '').trim()
    if (rawAccount && rawAccount.startsWith('{')) {
      const serviceAccount = JSON.parse(rawAccount)
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
      }
    }
  } catch (e) {
    console.error('[FCM] Initialization Error:', e)
  }
}

async function run() {
  console.log("Fetching active subscriptions...")
  const { data: subscriptions, error } = await supabaseAdmin
    .from('user_device_notifications')
    .select('endpoint, subscription_json, device_type, user_id')

  if (error || !subscriptions) {
    console.error("Error fetching subscriptions:", error)
    return
  }

  console.log(`Found ${subscriptions.length} registered devices. Sending broadcast push...`)
  
  let successCount = 0
  let failCount = 0

  const pushPromises = subscriptions.map(async (sub: any) => {
    const payloadTitle = 'Good Afternoon'
    const payloadMessage = 'Time to get to work and sell some properties.'
    const url = '/dashboard'

    try {
      if (sub.device_type === 'browser') {
        const pushPayload = JSON.stringify({
          title: payloadTitle,
          body: payloadMessage,
          url,
          tag: 'system'
        })
        await webpush.sendNotification(sub.subscription_json, pushPayload)
        successCount++
      } else if (sub.device_type === 'android' && admin.apps.length > 0) {
        await admin.messaging().send({
          token: sub.endpoint,
          notification: {
            title: payloadTitle,
            body: payloadMessage,
          },
          data: { url, type: 'system' },
          android: {
            priority: 'high',
            notification: { channelId: 'default' }
          }
        })
        successCount++
      }
    } catch (err: any) {
      failCount++
      if (err.statusCode === 404 || err.statusCode === 410 || err.code === 'messaging/registration-token-not-registered') {
        await supabaseAdmin.from('user_device_notifications').delete().eq('endpoint', sub.endpoint)
      }
    }
  })

  await Promise.all(pushPromises)

  console.log(`Broadcast Complete! Successfully sent to ${successCount} devices. (${failCount} invalid tokens removed).`)
}

run()
