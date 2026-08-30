'use client'

import React, { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getProperties } from "@/lib/actions/properties"
import { linkPropertyToBroker } from "@/lib/actions/brokers"
import { Property } from "@/lib/types/database"
import { toast } from "sonner"
import { Search, Loader2, Building2, Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"
import Image from "next/image"

interface LinkPropertyModalProps {
  brokerId: string
  brokerName: string
  isOpen: boolean
  onClose: () => void
}

export function LinkPropertyModal({ brokerId, brokerName, isOpen, onClose }: LinkPropertyModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch] = useDebounce(searchTerm, 400)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search properties when debounced search term changes
  useEffect(() => {
    if (isOpen) {
      setIsSearching(true)
      getProperties({ search: debouncedSearch, status: 'available' })
        .then(res => {
          setProperties(res?.data || [])
        })
        .finally(() => setIsSearching(false))
    }
  }, [debouncedSearch, isOpen])

  const handleLink = async () => {
    if (!selectedPropertyId) {
      toast.error("Please select a property")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await linkPropertyToBroker(brokerId, selectedPropertyId, 'shared', notes)
      if (result.error) throw new Error(result.error)
      
      toast.success("Property link recorded successfully")
      onClose()
      setSelectedPropertyId(null)
      setNotes("")
      setSearchTerm("")
    } catch (error: any) {
      toast.error(error.message || "Failed to link property")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-[2rem] border-none shadow-2xl p-8 max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <ExternalLink className="w-6 h-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">Record Shared Property</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Search for a property to record that you've shared it with <span className="text-slate-900 font-bold">{brokerName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2 -mr-2">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Search Property</Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <Input 
                placeholder="Search by title, locality or city..."
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl font-medium text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Available Inventory</Label>
            <div className="grid gap-2">
              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs font-bold">Finding properties...</p>
                </div>
              ) : properties.length > 0 ? (
                properties.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left group",
                      selectedPropertyId === p.id 
                        ? "bg-emerald-50 border-emerald-500" 
                        : "bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-100"
                    )}
                  >
                    <div className="w-16 h-12 rounded-lg bg-slate-100 relative overflow-hidden shrink-0">
                      {p.cover_image_url ? (
                        <Image src={p.cover_image_url} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-slate-200">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold text-sm truncate",
                        selectedPropertyId === p.id ? "text-emerald-900" : "text-slate-700"
                      )}>{p.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">{p.locality}, {p.city}</p>
                    </div>
                    {selectedPropertyId === p.id && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Building2 className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-bold">No properties found</p>
                </div>
              )}
            </div>
          </div>

          {selectedPropertyId && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Collaborator Notes</Label>
              <Textarea 
                placeholder="Optional: Commission split or specific client details..."
                className="bg-slate-50 border-none rounded-2xl min-h-[100px] p-4 text-slate-700 font-medium"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-slate-50">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-12 rounded-xl font-bold text-slate-500"
          >
            Cancel
          </Button>
          <Button 
            disabled={isSubmitting || !selectedPropertyId}
            onClick={handleLink}
            className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex items-center gap-2 shadow-xl shadow-slate-200"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Record Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
