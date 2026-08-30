'use client'

import React, { useState, useEffect, useTransition } from "react"
import { Search, Plus, X, Building2, Check, MapPin, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getProperties } from "@/lib/actions/properties"
import { linkShownProperty } from "@/lib/actions/shown-properties"
import { Property } from "@/lib/types/database"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface AddShownPropertyModalProps {
  clientId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddShownPropertyModal({ clientId, isOpen, onOpenChange, onSuccess }: AddShownPropertyModalProps) {
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState("")
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [externalTitle, setExternalTitle] = useState("")
  const [externalLocation, setExternalLocation] = useState("")
  const [notes, setNotes] = useState("")

  // Search logic
  useEffect(() => {
    if (!isOpen) {
      setSearch("")
      setSelectedPropertyId(null)
      setNotes("")
      setProperties([])
      setIsManualEntry(false)
      setExternalTitle("")
      setExternalLocation("")
      return
    }

    if (isManualEntry) return

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await getProperties({ search })
        setProperties(results?.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, isOpen, isManualEntry])

  const handleLink = () => {
    if (!selectedPropertyId && !externalTitle) return

    startTransition(async () => {
      const res = await linkShownProperty({
        clientId,
        propertyId: selectedPropertyId,
        externalTitle: isManualEntry ? externalTitle : undefined,
        externalLocation: isManualEntry ? externalLocation : undefined,
        notes
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Property linked to client history")
        onSuccess()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[calc(100dvh-2rem)] bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
        <DialogHeader className="px-5 py-4 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Add property shown</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 font-medium ">
            {isManualEntry
              ? "Enter details for a property not registered in your database."
              : "Search and select a property you have shown to this client."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3 space-y-4 flex-1 flex flex-col min-h-0">
          {isManualEntry ? (
            <div className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Property Name / Title</label>
                <Input
                  placeholder="e.g. 3BHK Flat in Jagatpura"
                  className="h-11 bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 ring-emerald-300  text-slate-800 transition-all rounded-2xl"
                  value={externalTitle}
                  onChange={(e) => setExternalTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    placeholder="e.g. Near Akshardham Temple"
                    className="pl-11 h-11 bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-slate-800 transition-all rounded-2xl"
                    value={externalLocation}
                    onChange={(e) => setExternalLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative group shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Search by title, location, BHK, or description…"
                  className="pl-11 h-11 bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-slate-800 transition-all rounded-2xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto min-h-[150px] pr-1 -mr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {properties.length > 0 ? (
                  <div className="space-y-2 pb-2">
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPropertyId(p.id)}
                        className={cn(
                          "w-full flex cursor-pointer items-center gap-3 p-3 rounded-2xl border-2 transition-all group text-left",
                          selectedPropertyId === p.id
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                            : "border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          selectedPropertyId === p.id ? "bg-emerald-500 text-white" : "bg-white text-slate-300 shadow-sm"
                        )}>
                          {selectedPropertyId === p.id ? <Check className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{p.title}</p>
                            <p className="text-xs font-black text-emerald-600 shrink-0">{formatCurrency(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <MapPin className="w-3 h-3" />
                              {p.locality || p.city}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <Plus className="w-3 h-3" />
                              {Array.isArray(p.bhk) ? p.bhk[0] : (p.bhk || p.bedrooms)} BHK
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center ring-8 ring-slate-50/50">
                      <Building2 className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">No properties found</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Try a different search term or use <button onClick={() => setIsManualEntry(true)} className="text-emerald-500 underline font-bold">manual entry</button></p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {(selectedPropertyId || isManualEntry) && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Internal Notes (Feedback)</label>
              <Textarea
                placeholder="How was the showing? 'Liked the kitchen but requested higher floor...'"
                className="min-h-[50px] bg-slate-100 border-none focus:bg-white transition-all rounded-2xl text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-2 mb-1 bg-slate-50/50 grid grid-rows-2 grid-cols-1 md:grid-rows-1 md:grid-cols-1 gap-2 shrink-0">
          <Button
            disabled={(!selectedPropertyId && !externalTitle) || isPending}
            onClick={handleLink}
            className="w-full py-5 max-md:py-4  rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-100 cursor-pointer transition-all border-none"
          >
            {isPending ? <Loader2 className="h-5 w-5  animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {isManualEntry ? "Save Record" : "Link Property"}
          </Button>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsManualEntry(!isManualEntry)
                setSelectedPropertyId(null)
              }}
              className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-emerald-600 hover:bg-emerald-50 border-emerald-200 border-2 transition-all cursor-pointer"
            >
              {isManualEntry ? "Search" : "Manual"}
            </Button>

            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-300 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
