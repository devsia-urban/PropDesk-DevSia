'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, CheckCircle2, X, User, Phone, CreditCard, FileText, IndianRupee, Loader2, Shield, Search, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createBooking, searchClientsForBooking } from '@/lib/actions/bookings'
import { useAuth } from '@/lib/context/auth-context'

interface BookingFormProps {
  propertyId: string
  propertyTitle: string
  bookingType: 'hold' | 'booked'
  onClose: () => void
  unitId?: string
}

interface ClientOption {
  id: string
  full_name: string
  phone: string
}

export function BookingForm({ propertyId, propertyTitle, bookingType, onClose, unitId }: BookingFormProps) {
  const router = useRouter()
  const { profile: authProfile, user } = useAuth()
  const [profile, setProfile] = useState(authProfile)

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile)
    } else if (user) {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient()
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }: { data: any }) => {
          if (data) setProfile(data)
        })
      })
    }
  }, [authProfile, user])
  const [isPending, startTransition] = useTransition()

  // Agent details
  const [agentRera, setAgentRera] = useState(profile?.rera_number || '')

  // Update RERA number if profile is fetched asynchronously
  useEffect(() => {
    if (profile?.rera_number) {
      setAgentRera(profile.rera_number)
    }
  }, [profile?.rera_number])

  // Client linking
  const [linkMode, setLinkMode] = useState<'search' | 'manual'>('search')
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Manual customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAadhaar, setCustomerAadhaar] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const isHold = bookingType === 'hold'

  // Search clients via server action
  useEffect(() => {
    if (linkMode !== 'search' || clientSearch.length < 2) {
      setClientResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchClientsForBooking(clientSearch)
        setClientResults(results)
      } catch {
        setClientResults([])
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [clientSearch, linkMode])

  const handleSelectClient = (client: ClientOption) => {
    setSelectedClient(client)
    setCustomerName(client.full_name)
    setCustomerPhone(client.phone)
    setClientSearch('')
    setClientResults([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalName = selectedClient?.full_name || customerName.trim()
    if (!finalName) {
      toast.error('Customer name is required')
      return
    }
    if (!customerAadhaar.trim()) {
      toast.error('Customer Aadhaar number is required')
      return
    }

    startTransition(async () => {
      const result = await createBooking({
        propertyId: propertyId || undefined as any,
        bookingType,
        customerName: finalName,
        customerPhone: (selectedClient?.phone || customerPhone).trim() || undefined,
        customerAadhaar: customerAadhaar.trim() || undefined,
        clientId: selectedClient?.id || undefined,
        agentRera: agentRera.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        notes: notes.trim() || undefined,
        unitId,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isHold ? 'Property hold for 24 hours!' : 'Property booked successfully!')
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Form Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn(
          "sticky top-0 z-10 px-6 pt-6 pb-4 rounded-t-3xl",
          isHold ? "bg-amber-50" : "bg-emerald-50"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isHold ? "bg-amber-100" : "bg-emerald-100"
              )}>
                {isHold ? <Lock className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isHold ? 'Hold Property (24hrs)' : 'Book Property'}
                </h2>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">{propertyTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/80 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          {isHold && (
            <p className="text-xs text-amber-600 font-semibold bg-amber-100 rounded-lg px-3 py-1.5">
              ⏰ This hold will auto-release after 24 hours if not converted to a booking.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Agent Details (Pre-filled) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Name</Label>
                <Input value={profile?.full_name || user?.user_metadata?.full_name || ''} disabled className="bg-slate-50 border-slate-100 text-slate-600 font-medium text-sm h-10 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Phone</Label>
                <Input value={profile?.phone || user?.phone || user?.user_metadata?.phone || 'Not set'} disabled className="bg-slate-50 border-slate-100 text-slate-600 font-medium text-sm h-10 rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> RERA Number
              </Label>
              <Input
                placeholder="Enter your RERA license number"
                value={agentRera}
                onChange={(e) => setAgentRera(e.target.value)}
                className="mt-1.5 h-10 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium"
              />
              {!profile?.rera_number && (
                <p className="text-[9px] text-amber-500 font-semibold mt-1">💡 Save your RERA in Settings → Profile to auto-fill next time</p>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Customer: Link existing or add new */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Details</p>
              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setLinkMode('search'); setSelectedClient(null); setCustomerName(''); setCustomerPhone('') }}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all",
                    linkMode === 'search' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"
                  )}
                >
                  Link Lead
                </button>
                <button
                  type="button"
                  onClick={() => { setLinkMode('manual'); setSelectedClient(null) }}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all",
                    linkMode === 'manual' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"
                  )}
                >
                  New Customer
                </button>
              </div>
            </div>

            {/* Link existing client */}
            {linkMode === 'search' && !selectedClient && (
              <div className="relative">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                  <Search className="w-3.5 h-3.5" /> Search your leads
                </Label>
                <Input
                  placeholder="Type client name or phone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium"
                />
                {isSearching && (
                  <div className="absolute right-3 top-[38px]">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {clientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    {clientResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{client.full_name}</p>
                          <p className="text-xs text-slate-400">{client.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientSearch.length >= 2 && clientResults.length === 0 && !isSearching && (
                  <p className="text-xs text-slate-400 mt-2 font-medium">No leads found. Switch to "New Customer" to enter manually.</p>
                )}
              </div>
            )}

            {/* Selected client badge */}
            {selectedClient && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-900">{selectedClient.full_name}</p>
                  <p className="text-xs text-emerald-600">{selectedClient.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedClient(null); setCustomerName(''); setCustomerPhone('') }}
                  className="p-1 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <X className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            )}

            {/* Manual customer name + phone */}
            {linkMode === 'manual' && (
              <>
                <div>
                  <Label htmlFor="customerName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer's full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Customer Phone
                  </Label>
                  <Input
                    id="customerPhone"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium"
                  />
                </div>
              </>
            )}

            {/* Aadhaar — always visible */}
            <div>
              <Label htmlFor="customerAadhaar" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Aadhaar Number *
              </Label>
              <Input
                id="customerAadhaar"
                placeholder="XXXX XXXX XXXX"
                value={customerAadhaar}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 12)
                  const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
                  setCustomerAadhaar(formatted)
                }}
                className="mt-1.5 h-11 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium tracking-wider"
                required
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Optional Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5" /> Token / Booking Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="₹ 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 h-11 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-emerald-300 text-sm font-medium min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-12 rounded-xl font-bold text-white text-sm shadow-lg transition-all",
              isHold
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
            )}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
            ) : isHold ? (
              <><Lock className="w-4 h-4 mr-2" /> Place 24hr Hold</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Booking</>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
