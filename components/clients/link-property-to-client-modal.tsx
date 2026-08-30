'use client'

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getProperties } from "@/lib/actions/properties"
import { linkPropertyToClient } from "@/lib/actions/client-property-links"
import { Property } from "@/lib/types/database"
import { toast } from "sonner"
import {
  Search,
  Loader2,
  Building2,
  Check,
  Home,
  IndianRupee,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"
import Image from "next/image"

interface PropertyLink {
  id: string
  property_id: string
  relation_type: string
  notes: string | null
  property: {
    id: string
    title: string
    city: string | null
    locality: string | null
    price: number | null
    cover_image_url: string | null
    property_type: string | null
    status: string | null
    bhk: number | null
    bedrooms: number | null
    area_sqft: number | null
    area_unit: string | null
    listing_type: string | null
  } | null
}

interface LinkPropertyToClientModalProps {
  clientId: string
  clientName: string
  isOpen: boolean
  onClose: () => void
  onLinked?: (newLink: PropertyLink) => void
}

function formatPrice(price: number | null | undefined) {
  if (!price) return "Price N/A"
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`
  return `₹${price.toLocaleString()}`
}

export function LinkPropertyToClientModal({
  clientId,
  clientName,
  isOpen,
  onClose,
  onLinked,
}: LinkPropertyToClientModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch] = useDebounce(searchTerm, 400)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load / search properties whenever modal opens or search changes
  useEffect(() => {
    if (!isOpen) return
    setIsSearching(true)
    getProperties({ search: debouncedSearch })
      .then((res) => setProperties(res?.data || []))
      .finally(() => setIsSearching(false))
  }, [debouncedSearch, isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setSelectedPropertyId(null)
      setNotes("")
    }
  }, [isOpen])

  const handleLink = async () => {
    if (!selectedPropertyId) {
      toast.error("Please select a property to link")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await linkPropertyToClient(clientId, selectedPropertyId, "sell", notes || undefined)
      if (result.error) throw new Error(result.error)

      // Find the selected property data to pass back optimistically
      const linkedProp = properties.find((p) => p.id === selectedPropertyId)
      if (linkedProp && result.data) {
        onLinked?.({
          id: (result.data as any).id,
          property_id: linkedProp.id,
          relation_type: 'sell',
          notes: notes || null,
          property: {
            id: linkedProp.id,
            title: linkedProp.title,
            city: linkedProp.city,
            locality: linkedProp.locality,
            price: linkedProp.price,
            cover_image_url: linkedProp.cover_image_url,
            property_type: linkedProp.property_type,
            status: linkedProp.status,
            bhk: Array.isArray(linkedProp.bhk) ? linkedProp.bhk[0] ?? null : null,
            bedrooms: linkedProp.bedrooms,
            area_sqft: linkedProp.area_sqft,
            area_unit: linkedProp.area_unit,
            listing_type: linkedProp.listing_type,
          },
        })
      }

      toast.success("Property linked to client successfully!")
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to link property")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-[2rem] border-none shadow-2xl p-8 max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Home className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">
            Link Property to Client
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Select a property from your inventory that{" "}
            <span className="text-slate-900 font-bold">{clientName}</span> wants to sell or rent out.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 -mr-1">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Search Property
            </Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <Input
                placeholder="Search by title, locality, city…"
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus-visible:ring-amber-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Property list */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Your Inventory
            </Label>

            {isSearching ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <p className="text-xs font-bold">Searching properties…</p>
              </div>
            ) : properties.length > 0 ? (
              <div className="grid gap-2">
                {properties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPropertyId(selectedPropertyId === p.id ? null : p.id)
                    }
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left group w-full",
                      selectedPropertyId === p.id
                        ? "bg-amber-50 border-amber-500"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-xl bg-slate-100 relative overflow-hidden shrink-0">
                      {p.cover_image_url ? (
                        <Image
                          src={p.cover_image_url}
                          alt={p.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-bold text-sm truncate",
                          selectedPropertyId === p.id ? "text-amber-900" : "text-slate-800"
                        )}
                      >
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {[p.locality, p.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-emerald-600">
                        <IndianRupee className="w-3 h-3" />
                        {formatPrice((p as any).price)}
                      </div>
                    </div>

                    {/* Check */}
                    {selectedPropertyId === p.id && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Building2 className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold">No properties found</p>
                <p className="text-[11px]">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Optional notes */}
          {selectedPropertyId && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Notes (optional)
              </Label>
              <Textarea
                placeholder="e.g. Client asking price, urgency, special conditions…"
                className="bg-slate-50 border-none rounded-2xl min-h-[90px] p-4 text-slate-700 font-medium resize-none"
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
            className="h-12 rounded-xl font-bold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !selectedPropertyId}
            onClick={handleLink}
            className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-100"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Home className="w-4 h-4" />
            )}
            Link Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
