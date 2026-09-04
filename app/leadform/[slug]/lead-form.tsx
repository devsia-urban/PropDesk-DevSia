'use client'

import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Loader2, Home, Key, Building, Map } from "lucide-react"

type TransactionType = 'buy' | 'rent' | 'sell' | 'lease'
type PropertyChip = '1 BHK' | '2 BHK' | '3 BHK' | '4+ BHK' | 'Villa' | 'Plot' | 'Commercial' | 'Farmhouse' | 'Farmer Land'


function formatIndianNumberText(num: number | string): string {
  if (!num) return ''
  const val = Number(num)
  if (isNaN(val) || val <= 0) return ''
  
  if (val >= 10000000) {
    return (val / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr'
  } else if (val >= 100000) {
    return (val / 100000).toFixed(2).replace(/\.00$/, '') + ' Lacs'
  } else if (val >= 1000) {
    return (val / 1000).toFixed(2).replace(/\.00$/, '') + ' K'
  }
  return val.toString()
}

export function LeadForm({ agencyId, agencyName, agentId }: { agencyId: string, agencyName: string, agentId?: string | null }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const [transaction, setTransaction] = useState<TransactionType>('buy')
  const [selectedTypes, setSelectedTypes] = useState<PropertyChip[]>([])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  const toggleType = (type: PropertyChip) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (selectedTypes.length === 0) {
      setError("Please select at least one Property Interest.")
      return
    }

    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    // Map chips to DB enums
    const preferred_bhks: number[] = []
    const property_types: string[] = []

    if (selectedTypes.includes('1 BHK')) { preferred_bhks.push(1); property_types.push('apartment', 'flat', 'floor') }
    if (selectedTypes.includes('2 BHK')) { preferred_bhks.push(2); property_types.push('apartment', 'flat', 'floor') }
    if (selectedTypes.includes('3 BHK')) { preferred_bhks.push(3); property_types.push('apartment', 'flat', 'floor') }
    if (selectedTypes.includes('4+ BHK')) { preferred_bhks.push(4, 5); property_types.push('apartment', 'flat', 'floor', 'penthouse') }
    if (selectedTypes.includes('Villa')) { property_types.push('villa', 'independent_house', 'kothi') }
    if (selectedTypes.includes('Plot')) { property_types.push('plot') }
    if (selectedTypes.includes('Commercial')) { property_types.push('commercial') }
    if (selectedTypes.includes('Farmhouse')) { property_types.push('farmhouse') }
    if (selectedTypes.includes('Farmer Land')) { property_types.push('farmer_land') }

    const rawLocations = formData.get('locations') as string
    const preferred_locations = rawLocations ? rawLocations.split(',').map(l => l.trim()).filter(Boolean) : []

    const data = {
      agency_id: agencyId,
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
      looking_for: transaction,
      preferred_bhks: Array.from(new Set(preferred_bhks)),
      property_types: Array.from(new Set(property_types)),
      budget_min: Number(formData.get('budget_min')),
      budget_max: Number(formData.get('budget_max')),
      preferred_locations,
      min_area_sqft: formData.get('area') ? Number(formData.get('area')) : null,
      possession_timeline: formData.get('timeline') || null,
      notes: formData.get('notes'),
      source: 'social_media',
      assigned_to: agentId || null
    }

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit')

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="p-10 text-center rounded-[2rem] border-slate-100 shadow-xl shadow-emerald-900/5 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Request Received!</h2>
        <p className="text-slate-500 font-medium max-w-sm mx-auto">
          Thank you for reaching out. A representative from <strong className="text-slate-900">{agencyName}</strong> will contact you shortly on your provided number.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 md:p-10 rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">How can we help you?</h2>
        <p className="text-slate-500 font-medium text-sm">Select your requirements below and we will get back to you immediately.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 font-bold text-sm rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Transaction Type */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">I am looking to... <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'buy', label: 'Buy', icon: <Home className="w-4 h-4 mb-1" /> },
              { id: 'rent', label: 'Rent', icon: <Key className="w-4 h-4 mb-1" /> },
              { id: 'sell', label: 'Sell', icon: <Building className="w-4 h-4 mb-1" /> },
              { id: 'lease', label: 'Lease', icon: <Map className="w-4 h-4 mb-1" /> },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTransaction(type.id as TransactionType)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  transaction === type.id 
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {type.icon}
                <span className="font-bold text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Property Interest <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {(['1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Villa', 'Plot', 'Commercial', 'Farmhouse', 'Farmer Land'] as PropertyChip[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-all ${
                  selectedTypes.includes(type)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Min Budget (₹) <span className="text-red-500">*</span></label>
              <input required name="budget_min" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="E.g. 5000000" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50" />
              {budgetMin && <p className="text-[10px] font-bold text-emerald-600 mt-1">{formatIndianNumberText(budgetMin)}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Max Budget (₹) <span className="text-red-500">*</span></label>
              <input required name="budget_max" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="E.g. 10000000" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50" />
              {budgetMax && <p className="text-[10px] font-bold text-emerald-600 mt-1">{formatIndianNumberText(budgetMax)}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location Preference</label>
              <input 
                name="locations"
                type="text" 
                placeholder="E.g. Mansarovar, Jagatpura"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Min Area (Sq.Ft)</label>
              <input 
                name="area"
                type="number" 
                placeholder="E.g. 1000"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Timeline</label>
              <select 
                name="timeline"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50"
              >
                <option value="">Select Timeline</option>
                <option value="Immediate">Immediate</option>
                <option value="15 days">Within 15 days</option>
                <option value="1-3 months">1 to 3 months</option>
                <option value="3-6 months">3 to 6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></label>
              <input 
                required
                name="full_name"
                type="text" 
                placeholder="John Doe"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number <span className="text-red-500">*</span></label>
              <input 
                required
                name="phone"
                type="tel" 
                placeholder="+91 9876543210"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Additional Notes</label>
            <textarea 
              name="notes"
              rows={3}
              placeholder="Any specific requirements?"
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900 outline-none resize-none bg-slate-50/50"
            ></textarea>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Send Request
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
