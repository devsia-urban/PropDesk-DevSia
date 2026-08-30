"use client"

import React, { useState } from "react"
import { AlertCircle, Clock, CreditCard, ShieldAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { differenceInDays, parseISO } from "date-fns"

interface SubscriptionBannerProps {
  status: string
  endDate: string | null
  planType: string
  isSuperAdmin?: boolean
  isAdmin?: boolean
}

export function SubscriptionBanner({ status, endDate, planType, isSuperAdmin, isAdmin }: SubscriptionBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Super Admin bypass
  if (isSuperAdmin) return null

  if (!endDate) return null

  const daysLeft = endDate ? differenceInDays(parseISO(endDate), new Date()) : 0
  const isExpired = daysLeft < 0 && status !== 'active' // Strict check
  const isOverdue = daysLeft < 0
  const isExpiringTomorrow = daysLeft === 1
  const isLastDay = daysLeft === 0
  const is3DaysLeft = daysLeft === 3
  const isWarning = (daysLeft <= 3 && daysLeft >= 0) || isOverdue

  // 🛑 HARD BLOCK: If subscription is expired, show full screen overlay to EVERYONE
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-9999 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Subscription Expired</h2>
            <p className="text-slate-500 font-medium">Your access has ended. Please contact your administrator or renew to continue.</p>
          </div>
          <button
            onClick={() => window.open('https://wa.me/9182713190911?text=Hi, my subscription has expired. I want to renew my account.', '_blank')}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3"
          >
            <CreditCard className="w-5 h-5" />
            Renew via WhatsApp
          </button>
          <p className="text-xs text-slate-400 font-medium">Restoration is instant after payment.</p>
        </div>
      </div>
    )
  }

  // 🛡️ ADMIN ONLY CHECK: Banners (non-blocking) are only for admins
  if (!isAdmin || !isVisible) return null

  // Logic for showing the banner
  const isTrial = status === 'trial'
  const isPaused = status === 'paused'
  const isPaid = status === 'active'

  const shouldShow = isTrial || isPaused || (isPaid && daysLeft <= 3) || isOverdue

  if (!shouldShow) return null

  return (
    <div className={cn(
      "w-full px-6 py-3 flex items-center justify-between gap-3 text-sm font-bold transition-all animate-in fade-in slide-in-from-top-2 relative z-100",
      isLastDay || isExpiringTomorrow ? "bg-slate-900 text-slate-100" :
        isWarning ? "bg-red-600 text-white" : "bg-emerald-500 text-white"
    )}>
      <div className="flex-1 flex items-center justify-center gap-3 text-center">
        {isLastDay ? (
          <>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">⚠️ FINAL DAY: Renew now to prevent service interruption!</span>
          </>
        ) : isExpiringTomorrow ? (
          <>
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest">your subcriptio may expire tommorw refill for better an smooth experice</span>
          </>
        ) : is3DaysLeft ? (
          <>
            <AlertCircle className="w-4 h-4 text-white/80" />
            <span className="text-xs font-black uppercase tracking-widest">Renewal Notice: 3 days left in your current period.</span>
          </>
        ) : isOverdue ? (
          <>
            <ShieldAlert className="w-4 h-4 text-white/80" />
            <span className="text-xs font-black uppercase tracking-widest">SUBSCRIPTION OVERDUE BY {Math.abs(daysLeft)} DAYS. PLEASE REFILL IMMEDIATELY.</span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 opacity-80" />
            <span className="text-xs font-black uppercase tracking-widest">Subscription Renewal: {daysLeft} days remaining</span>
          </>
        )}

        <button
          onClick={() => window.open('https://wa.me/9182713190911?text=I%20want%20to%20renew%20my%20DevSia%20subscription', '_blank')}
          className="ml-4 px-5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all text-[11px] font-black flex items-center gap-2 shadow-xl shadow-black/10 uppercase tracking-tighter"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Refill Now
        </button>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label="Close banner"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
