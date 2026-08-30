'use client'

import React, { useState } from 'react'
import { Lock, CheckCircle2, Clock, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingForm } from '@/components/bookings/booking-form'
import { cn } from '@/lib/utils'

interface PropertyBookingButtonsProps {
  propertyId: string
  propertyTitle: string
  propertyStatus: string
}

export function PropertyBookingButtons({ propertyId, propertyTitle, propertyStatus }: PropertyBookingButtonsProps) {
  const [showForm, setShowForm] = useState<'hold' | 'booked' | null>(null)

  const isAvailable = propertyStatus === 'available'
  const isHold = propertyStatus === 'hold'
  const isBooked = propertyStatus === 'booked'
  const isSold = propertyStatus === 'sold'
  const isRented = propertyStatus === 'rented'

  return (
    <div className="space-y-1">
      {/* Status Banners */}
      {isHold && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-1">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">On Hold (24hrs)</p>
            <p className="text-xs text-amber-600">This property is currently on a 24-hour hold.</p>
          </div>
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      )}

      {isBooked && (
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-800">Booked</p>
            <p className="text-xs text-blue-600">This property is currently booked.</p>
          </div>
        </div>
      )}

      {isSold && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <Ban className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Sold</p>
            <p className="text-xs text-red-500">This property has been sold.</p>
          </div>
        </div>
      )}

      {isRented && (
        <div className="flex items-center gap-3 p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-purple-800">Rented</p>
            <p className="text-xs text-purple-500">This property has been rented out.</p>
          </div>
        </div>
      )}

      {/* Booking Buttons (Visible but disabled if not available) */}
      <div className="flex flex-col xl:grid xl:grid-cols-2 gap-3">
        <Button
          onClick={() => isAvailable && setShowForm('hold')}
          disabled={!isAvailable}
          className={cn(
            "py-2.5 cursor-pointer rounded-xl font-bold text-sm shadow-sm flex-1 gap-2 transition-all",
            isAvailable
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-slate-100 text-slate-400 hidden cursor-not-allowed opacity-70 border border-slate-200"
          )}
        >
          <Lock className="w-4 h-4" />
          {isHold ? 'Already on Hold' : 'Hold (24hrs)'}
        </Button>
        <Button
          onClick={() => isAvailable && setShowForm('booked')}
          disabled={!isAvailable}
          className={cn(
            "py-2.5 cursor-pointer rounded-xl font-bold text-sm shadow-sm flex-1 gap-2 transition-all",
            isAvailable
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-400 hidden cursor-not-allowed opacity-70 border border-slate-200"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isBooked ? 'Already Booked' : 'Book Now'}
        </Button>
      </div>

      {showForm && (
        <BookingForm
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          bookingType={showForm}
          onClose={() => setShowForm(null)}
        />
      )}
    </div>
  )
}
