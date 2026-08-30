'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, Lock, CheckCircle2, Clock, XCircle, Home, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBookings } from '@/lib/actions/bookings'
import { BookingCard } from '@/components/bookings/booking-card'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'

interface BookingsClientProps {
  isAdmin: boolean
}

export function BookingsClient({ isAdmin }: BookingsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = searchParams.get('tab') || 'holds'
  const activeType = searchParams.get('type') || 'property'

  // Fetch based on active tab
  const fetchKey = { tab: activeTab }
  const fetcher = async ([, { tab }]: any) => {
    return await getBookings(
      tab === 'holds' ? { bookingType: 'hold', status: 'active' } :
      tab === 'booked' ? { bookingType: 'booked', status: 'active' } :
      tab === 'requests' ? { status: 'cancel_requested' } :
      {}  // history = all
    )
  }

  const { data: allBookings, isLoading, error, mutate } = useSWR(['bookings', fetchKey], fetcher)

  // Filter based on Type (Property vs Scheme/Unit)
  let bookings = (allBookings || []).filter(b => {
    if (activeType === 'property') return !!b.property_id
    if (activeType === 'scheme') return !!b.unit_id
    return true
  })

  // For history tab, show only non-active records
  if (activeTab === 'history') {
    bookings = bookings.filter(b => b.status !== 'active' && b.status !== 'cancel_requested')
  }

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs = [
    { key: 'holds', label: 'Queue (Holds)', icon: Lock, color: 'text-amber-600' },
    { key: 'booked', label: 'Booked', icon: CheckCircle2, color: 'text-emerald-600' },
    ...(isAdmin ? [{ key: 'requests', label: 'Cancel Requests', icon: Clock, color: 'text-red-500' }] : []),
    { key: 'history', label: 'History', icon: XCircle, color: 'text-slate-400' },
  ]

  const types = [
    { key: 'property', label: 'Individual Properties', icon: Home },
    { key: 'scheme', label: 'Township Schemes', icon: Layers },
  ]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-emerald-600" />
            </div>
            Bookings
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">
            Sales Pipeline & Inventory Status
          </p>
        </div>

        {/* Type Toggle */}
        <div className="bg-slate-100/80 p-1.5 rounded-[1.25rem] flex items-center gap-1 self-start md:self-auto border border-slate-200/50">
          {types.map(t => {
            const Icon = t.icon
            const isActive = activeType === t.key
            return (
              <button
                key={t.key}
                onClick={() => updateFilters('type', t.key)}
                className={cn(
                  "flex items-center gap-2 h-10 px-5 rounded-[0.9rem] text-xs font-black uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-500" : "opacity-50")} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollremove pb-1 border-b border-slate-100">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => updateFilters('tab', tab.key)}
              className={cn(
                "flex items-center gap-2 h-12 px-5 text-sm font-black transition-all whitespace-nowrap border-b-2 -mb-px",
                isActive
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/30 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? tab.color : "")} />
              {tab.label}
              {isActive && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">
                  {isLoading ? <div className="w-2.5 h-2.5 border border-emerald-700 border-t-transparent rounded-full animate-spin" /> : bookings.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Booking Cards */}
      <div className="relative">
        {isLoading && (
           <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-[3rem] flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
           </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-[3rem] border border-red-100 border-dashed">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 text-center max-w-sm mb-6">Could not fetch bookings.</p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : isLoading && bookings.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="space-y-2 flex-1 pt-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isAdmin={isAdmin || false} 
                onAction={(actionId, bookingId) => {
                  let updatedData = [...(allBookings || [])]
                  const idx = updatedData.findIndex(b => b.id === bookingId)
                  if (idx === -1) return

                  if (actionId === 'convert') {
                    // It becomes a 'booked' type instead of 'hold'
                    updatedData[idx] = { ...updatedData[idx], booking_type: 'booked', hold_expires_at: null }
                  } else if (actionId === 'release') {
                    updatedData[idx] = { ...updatedData[idx], status: 'released' }
                  } else if (actionId === 'mark_sold' || actionId === 'mark_rented') {
                    updatedData[idx] = { ...updatedData[idx], status: 'converted' }
                  } else if (actionId === 'cancel' || actionId === 'approve_cancel') {
                    updatedData[idx] = { ...updatedData[idx], status: 'cancelled' }
                  } else if (actionId === 'request_cancel') {
                    updatedData[idx] = { ...updatedData[idx], status: 'cancel_requested' }
                  }

                  mutate(updatedData, { revalidate: false })
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <CalendarCheck className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              {activeTab === 'holds' ? `No active ${activeType} holds` :
               activeTab === 'booked' ? `No active ${activeType} bookings` :
               activeTab === 'requests' ? 'No cancel requests' :
               'No history found'}
            </h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-xs text-center opacity-60">
              {activeTab === 'holds' || activeTab === 'booked'
                ? 'Start by placing a hold on a property or scheme.'
                : 'Past transactions will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
