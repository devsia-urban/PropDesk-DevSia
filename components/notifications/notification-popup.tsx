'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Calendar, 
  User, 
  Building2, 
  Sparkles, 
  Info,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Notification } from '@/lib/types/database'
import Link from 'next/link'

interface NotificationPopupProps {
  notification: Notification | null
  onClose: () => void
}

export function NotificationPopup({ notification, onClose }: NotificationPopupProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!notification) {
      setProgress(100)
      return
    }

    const duration = 6000
    const interval = 10
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [notification, onClose])

  const getIcon = () => {
    const type = notification?.type
    if (type?.includes('followup') || type?.includes('system')) return <Calendar className="w-5 h-5" />
    if (type?.includes('client')) return <User className="w-5 h-5" />
    if (type?.includes('property')) return <Building2 className="w-5 h-5" />
    if (type?.includes('match')) return <Sparkles className="w-5 h-5" />
    return <Bell className="w-5 h-5" />
  }

  const getTheme = () => {
    const title = notification?.title?.toLowerCase() || ''
    if (title.includes('warning') || title.includes('alert')) return 'bg-amber-500'
    if (title.includes('now') || title.includes('urgent')) return 'bg-rose-500'
    if (title.includes('match') || title.includes('new')) return 'bg-emerald-500'
    return 'bg-blue-500'
  }

  const getLink = () => {
    if (!notification?.reference_id) return '/notifications'
    if (notification.reference_type === 'client') return `/clients/${notification.reference_id}`
    if (notification.reference_type === 'property') return `/properties/${notification.reference_id}`
    return '/notifications'
  }

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 20, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
          className="fixed top-0 left-1/2 z-[9999] w-full max-w-[400px] px-4 pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden pointer-events-auto">
            <div className="p-4 flex gap-4">
              {/* Icon Section */}
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg",
                getTheme()
              )}>
                {getIcon()}
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {notification.title}
                  </h3>
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {notification.message}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={getLink()}
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl transition-all"
                  >
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Just Now
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100/50">
              <motion.div 
                className={cn("h-full", getTheme())}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
