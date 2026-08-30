'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Unit } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Maximize2,
  Compass,
  IndianRupee,
  Tag,
  Info,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Layers,
  MapPin,
  Video,
  ImageIcon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookingForm } from '@/components/bookings/booking-form'
import { useAuth } from '@/lib/context/auth-context'
import { convertHoldToBooked, releaseHold } from '@/lib/actions/bookings'
import { toast } from 'sonner'

interface PlotGridProps {
  units: any[]
  schemeName: string
  mapImageUrl?: string
  videoUrl?: string
}

export default function PlotGrid({ units, schemeName, mapImageUrl, videoUrl }: PlotGridProps) {
  const { profile } = useAuth()
  const [filter, setFilter] = useState<'all' | 'available' | 'hold' | 'booked' | 'sold'>('all')
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null)
  const [bookingType, setBookingType] = useState<'hold' | 'booked' | null>(null)
  const [detailUnit, setDetailUnit] = useState<any | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 shadow-emerald-500/20'
      case 'hold': return 'bg-amber-500 shadow-amber-500/20'
      case 'booked': return 'bg-blue-500 shadow-blue-500/20'
      case 'sold': return 'bg-rose-500 shadow-rose-500/20'
      default: return 'bg-slate-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'hold': return 'On Hold'
      case 'booked': return 'Booked'
      case 'sold': return 'Sold'
      default: return status
    }
  }

  // 1. Filter
  // 2. Sort (Available -> Hold -> Booked -> Sold) then by unit number numerically
  const displayUnits = useMemo(() => {
    let filtered = units
    if (filter !== 'all') {
      filtered = units.filter(u => u.status === filter)
    }

    return [...filtered].sort((a, b) => {
      const order: Record<string, number> = { 'available': 1, 'hold': 2, 'booked': 3, 'sold': 4 }

      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status]
      }

      // Numeric sort for plots like "Plot 1", "Plot 10", "Plot 2"
      const numA = parseInt(a.unit_number.replace(/\D/g, '')) || 0
      const numB = parseInt(b.unit_number.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [units, filter])

  const FilterBadge = ({ status, label, colorClass }: { status: any, label: string, colorClass: string }) => {
    const isActive = filter === status || filter === 'all'
    const isSelected = filter === status
    return (
      <button
        onClick={() => setFilter(isSelected ? 'all' : status)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-2",
          isSelected ? "border-slate-300 bg-white shadow-sm" : "border-transparent hover:bg-slate-100 opacity-80"
        )}
      >
        <div className={cn("w-3 h-3 rounded-full", colorClass)} />
        <span className={cn("text-xs font-bold uppercase tracking-wider", isActive ? "text-slate-800" : "text-slate-500")}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-8">
      {/* Legend / Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-[2rem] border border-slate-100">
        <FilterBadge status="available" label="Available" colorClass="bg-emerald-500" />
        <FilterBadge status="hold" label="Hold (24h)" colorClass="bg-amber-500" />
        <FilterBadge status="booked" label="Booked" colorClass="bg-blue-500" />
        <FilterBadge status="sold" label="Sold" colorClass="bg-rose-500" />
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="ml-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">
            Clear Filter
          </button>
        )}
      </div>

      {/* Grid */}
      {displayUnits.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-bold">No plots match your current filter.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setFilter('all')}>View All Plots</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayUnits.map((unit) => (
            <div
              key={unit.id}
              onClick={() => setDetailUnit(unit)}
              className={cn(
                "p-4 rounded-[1.5rem] flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm border-2 bg-white",
                unit.status === 'available' ? "hover:border-emerald-400 border-slate-100" : "opacity-90 border-transparent",
                unit.status === 'hold' && "bg-amber-50 border-amber-100/50",
                unit.status === 'booked' && "bg-blue-50 border-blue-100/50",
                unit.status === 'sold' && "bg-rose-50 border-rose-100/50"
              )}
            >
              <div>
                <span className={cn(
                  "text-lg font-black leading-none block mb-1",
                  unit.status === 'available' ? "text-slate-900" : "text-slate-700"
                )}>
                  {unit.unit_number.startsWith('Plot') ? unit.unit_number.replace('Plot ', 'Plot-') : `Plot-${unit.unit_number}`}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{schemeName}</span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  unit.status === 'available' ? "text-emerald-600" :
                    unit.status === 'hold' ? "text-amber-600" :
                      unit.status === 'booked' ? "text-blue-600" :
                        "text-rose-600"
                )}>
                  {getStatusText(unit.status)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{unit.area_sqyd} sqyd</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog (Mobile Friendly) */}
      <Dialog open={!!detailUnit} onOpenChange={(open) => !open && setDetailUnit(null)}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden border-none shadow-2xl">
          {detailUnit && (
            <div>
              <div className={cn(
                "px-4 py-3 flex items-center justify-between text-white",
                getStatusColor(detailUnit.status).split(' ')[0]
              )}>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-widest leading-none">{detailUnit.unit_number}</h3>
                  <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest">{schemeName}</p>
                </div>
                <Badge variant="outline" className="text-xs px-3 py-1 bg-white/20 border-white/30 text-white font-black uppercase tracking-wider">
                  {getStatusText(detailUnit.status)}
                </Badge>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Dimensions</span>
                    </div>
                    <p className="text-base font-black text-slate-900">{detailUnit.dimensions || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Compass className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Facing</span>
                    </div>
                    <p className="text-base font-black text-slate-900">{detailUnit.facing || 'N/A'}</p>
                  </div>
                </div>

                {detailUnit.details?.road_info && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Road Info</span>
                    </div>
                    <p className="text-base font-black text-slate-900">{detailUnit.details.road_info}</p>
                  </div>
                )}

                {detailUnit.plc && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-700">{detailUnit.plc}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <IndianRupee className="w-5 h-5" />
                      <span className="text-2xl font-black tracking-tight">{(detailUnit.rate_per_sqyd || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Rate per Sq.Yard</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      ₹{((detailUnit.rate_per_sqyd || 0) * (detailUnit.area_sqyd || 0)).toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Approx Total</span>
                  </div>
                </div>

                {detailUnit.status === 'available' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        setSelectedUnit(detailUnit);
                        setBookingType('hold');
                        setDetailUnit(null); // Close detail modal
                      }}
                      className="py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 cursor-pointer text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Hold (24h)
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUnit(detailUnit);
                        setBookingType('booked');
                        setDetailUnit(null); // Close detail modal
                      }}
                      className="py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 cursor-pointer text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </div>
                )}

                {detailUnit.status !== 'available' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                    <p className="text-center text-xs font-bold text-slate-500">
                      This unit is currently <span className="text-slate-900 uppercase">{getStatusText(detailUnit.status)}</span>.
                    </p>

                    {detailUnit.status === 'hold' && detailUnit.active_booking?.agent_id === profile?.id && (
                      <div className="space-y-2">
                        <Button
                          disabled={isConverting}
                          onClick={async () => {
                            setIsConverting(true)
                            const res = await convertHoldToBooked(detailUnit.active_booking.id)
                            setIsConverting(false)
                            if (res.error) toast.error(res.error)
                            else {
                              toast.success('Hold successfully converted to booking!')
                              setDetailUnit(null)
                            }
                          }}
                          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
                        >
                          {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Convert to Booking
                        </Button>

                        <Button
                          variant="outline"
                          disabled={isConverting}
                          onClick={async () => {
                            if (!confirm('Are you sure you want to release this hold?')) return
                            setIsConverting(true)
                            const res = await releaseHold(detailUnit.active_booking.id)
                            setIsConverting(false)
                            if (res.error) toast.error(res.error)
                            else {
                              toast.success('Hold released successfully!')
                              setDetailUnit(null)
                            }
                          }}
                          className="w-full h-12 rounded-xl border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold text-sm"
                        >
                          Cancel / Release Hold
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {mapImageUrl && (
                      <Button
                        variant="outline"
                        onClick={() => setShowMap(true)}
                        className="w-full py-5 rounded-2xl border-2 border-emerald-100 text-emerald-600 cursor-pointer font-bold hover:bg-emerald-50 transition-all text-sm uppercase tracking-wider"
                      >
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Img
                      </Button>
                    )}

                    {videoUrl && (
                      <Link href={videoUrl} target="_blank">
                        <Button
                          variant="outline"
                          className="w-full py-5 rounded-2xl border-2 border-blue-100 text-blue-600 cursor-pointer font-bold hover:bg-blue-50 transition-all text-sm uppercase tracking-wider"
                        >
                          <Video className="w-5 h-5 mr-2" />
                          Video
                        </Button>
                      </Link>
                    )}
                  </div>

                  <Link href={`/schemes/unit/${detailUnit.id}`} className="w-full">
                    <Button variant="outline" className="w-full py-5 rounded-2xl border-2 border-slate-200 text-slate-600 cursor-pointer font-bold hover:bg-slate-50 hover:text-slate-900 transition-all text-sm uppercase tracking-wider">
                      <Info className="w-5 h-5 mr-2" />
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Site Map Full Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-5xl p-2 bg-black/90 backdrop-blur-xl border-none rounded-[2rem] overflow-hidden">
          <div className="relative aspect-[16/10] w-full">
            {mapImageUrl && (
              <img
                src={mapImageUrl}
                alt="Site Map"
                className="w-full h-full object-contain rounded-[1.5rem]"
              />
            )}
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Dialog */}
      {selectedUnit && bookingType && (
        <BookingForm
          propertyId="" // Not needed for units
          propertyTitle={`${selectedUnit.unit_number} - ${schemeName}`}
          bookingType={bookingType}
          onClose={() => {
            setSelectedUnit(null)
            setBookingType(null)
          }}
          unitId={selectedUnit.id}
        />
      )}
    </div>
  )
}
