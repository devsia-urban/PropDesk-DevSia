'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Lock, CheckCircle2, Clock, XCircle, ArrowRight, Timer,
  User, Phone, CreditCard, Building2, IndianRupee, Loader2, MoreHorizontal, Layers
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatCurrency } from '@/lib/utils'
import { BookingWithDetails } from '@/lib/types/database'
import { convertHoldToBooked, requestCancelBooking, cancelBooking, markBookingCompleted, releaseHold } from '@/lib/actions/bookings'
import Link from 'next/link'

interface BookingCardProps {
  booking: BookingWithDetails
  isAdmin: boolean
  onAction?: (actionId: string, bookingId: string) => void
}

// Countdown hook for hold expiry
function useCountdown(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) return

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        return
      }
      const hrs = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${hrs}h ${mins}m left`)
      setIsExpired(false)
    }

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return { timeLeft, isExpired }
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Lock }> = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  released: { label: 'Released', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Clock },
  converted: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  cancel_requested: { label: 'Cancel Requested', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
}

export function BookingCard({ booking, isAdmin, onAction }: BookingCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { timeLeft, isExpired } = useCountdown(booking.hold_expires_at)
  const isHold = booking.booking_type === 'hold'
  const isActive = booking.status === 'active'
  const config = statusConfig[booking.status] || statusConfig.active
  const StatusIcon = config.icon

  const initials = booking.agent_name
    .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleAction = (actionId: string, action: () => Promise<any>, successMsg: string) => {
    if (onAction) onAction(actionId, booking.id)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(successMsg)
      }
    })
  }

  return (
    <Card className={cn(
      "border rounded-2xl overflow-hidden transition-all hover:shadow-md group",
      isActive && isHold ? "border-amber-200 bg-amber-50/30" :
        isActive ? "border-emerald-200 bg-emerald-50/20" :
          "border-slate-100 bg-white"
    )}>
      <CardContent className="p-5 space-y-4">
        {/* Top: Status + Timer + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5", config.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {booking.status === 'converted' 
                ? (booking.unit?.status || booking.property?.status || config.label) 
                : `${isHold ? 'Hold' : 'Booked'} · ${config.label}`}
            </Badge>
            {isHold && isActive && !isExpired && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold border px-2 py-0.5">
                <Timer className="w-3 h-3 mr-1" />
                {timeLeft}
              </Badge>
            )}
          </div>

          {isActive && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-xl border-slate-100 w-52">

                {isHold && isActive && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleAction('convert', () => convertHoldToBooked(booking.id), 'Converted to booking!')}
                      className="text-emerald-600 font-semibold gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Convert to Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction('release', () => releaseHold(booking.id), 'Hold released successfully!')}
                      className="text-red-500 font-semibold gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Release / Cancel Hold
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && booking.booking_type === 'booked' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleAction('mark_sold', () => markBookingCompleted(booking.id, 'sold'), 'Marked as Sold!')}
                      className="text-red-600 font-semibold gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction('mark_rented', () => markBookingCompleted(booking.id, 'rented'), 'Marked as Rented!')}
                      className="text-purple-600 font-semibold gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Rented
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin ? (
                  <DropdownMenuItem
                    onClick={() => handleAction('cancel', () => cancelBooking(booking.id), 'Booking cancelled!')}
                    className="text-red-500 font-semibold gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Booking
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleAction('request_cancel', () => requestCancelBooking(booking.id), 'Cancel request sent to admin!')}
                    className="text-amber-600 font-semibold gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Request Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {booking.status === 'cancel_requested' && (
          <Button variant="outline" size="sm"
            onClick={() => handleAction('approve_cancel', () => cancelBooking(booking.id), 'Booking cancelled!')}
            className="text-red-500 cursor-pointer  font-semibold gap-2"
          >
            <XCircle className="w-4 h-4" /> Approve cancelation
          </Button>
        )}

        {/* Property/Unit Info */}
        {booking.unit ? (
          <Link href={`/schemes/unit/${booking.unit.id}`} className="block group/link">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                <Layers className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate group-hover/link:text-emerald-600 transition-colors">
                  Unit {booking.unit.unit_number}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {(booking.unit as any).scheme?.name || 'Scheme'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                  {(booking.unit as any).scheme?.location_details || 'Township Scheme'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-emerald-500 transition-colors shrink-0" />
            </div>
          </Link>
        ) : (
          <Link href={`/properties/${booking.property?.id}`} className="block group/link">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {booking.property?.cover_image_url ? (
                  <img src={booking.property.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate group-hover/link:text-emerald-600 transition-colors">
                  {booking.property?.title || 'Property'}
                </p>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {[booking.property?.locality, booking.property?.city].filter(Boolean).join(', ')}
                </p>
                {booking.property?.price && (
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(booking.property.price)}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-emerald-500 transition-colors shrink-0" />
            </div>
          </Link>
        )}

        <div className="h-px bg-slate-100" />

        {/* Customer + Agent */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {booking.customer_name}
            </p>
            {booking.customer_phone && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {booking.customer_phone}
              </p>
            )}
            {booking.customer_aadhaar && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" /> {booking.customer_aadhaar}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</p>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[9px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-bold text-slate-900">{booking.agent_name}</p>
            </div>
            {booking.agent_phone && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {booking.agent_phone}
              </p>
            )}
          </div>
        </div>

        {/* Amount + Date */}
        {(booking.amount || booking.notes) && (
          <>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between text-xs">
              {booking.amount && (
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" /> Token: {formatCurrency(booking.amount)}
                </span>
              )}
              {booking.notes && (
                <span className="text-slate-400 font-medium truncate max-w-[200px]" title={booking.notes}>
                  {booking.notes}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card >
  )
}
