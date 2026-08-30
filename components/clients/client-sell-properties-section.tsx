'use client'

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Plus,
  Building2,
  MapPin,
  IndianRupee,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LinkPropertyToClientModal } from "./link-property-to-client-modal"
import { unlinkPropertyFromClient } from "@/lib/actions/client-property-links"
import { useRouter } from "next/navigation"
import { getMatchesForProperty } from "@/lib/actions/matches"
import { Users } from "lucide-react"

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

interface ClientSellPropertiesSectionProps {
  clientId: string
  clientName: string
  initialLinks: PropertyLink[]
}

function formatPrice(price: number | null | undefined) {
  if (!price) return "Price N/A"
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`
  return `₹${price.toLocaleString()}`
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-slate-100 text-slate-600",
  rented: "bg-blue-100 text-blue-700",
}

export function ClientSellPropertiesSection({
  clientId,
  clientName,
  initialLinks,
}: ClientSellPropertiesSectionProps) {
  const router = useRouter()
  const [links, setLinks] = useState<PropertyLink[]>(initialLinks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({})

  React.useEffect(() => {
    let isMounted = true
    const fetchMatches = async () => {
      const counts: Record<string, number> = {}
      for (const link of initialLinks) {
        if (link.property_id) {
          try {
            const matches = await getMatchesForProperty(link.property_id)
            counts[link.property_id] = matches.length
          } catch (err) {}
        }
      }
      if (isMounted) setMatchCounts(counts)
    }
    fetchMatches()
    return () => { isMounted = false }
  }, [initialLinks])

  // Optimistically add the new link to state immediately, then refresh in background
  const handleLinked = (newLink: PropertyLink) => {
    setLinks((prev) => [newLink, ...prev])
    // Background refresh to keep server cache in sync
    router.refresh()
  }

  const handleUnlink = async (link: PropertyLink) => {
    setRemovingId(link.id)
    try {
      const result = await unlinkPropertyFromClient(link.id, clientId)
      if (result.error) throw new Error(result.error)
      setLinks((prev) => prev.filter((l) => l.id !== link.id))
      toast.success("Property unlinked successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink property")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Home className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No property linked yet</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-[200px] mx-auto">
                Link a property from your inventory that this client wants to sell or rent out
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Link Property
            </Button>
          </div>
        ) : (
          <>
            {links.map((link) => {
              const p = link.property
              if (!p) return null
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-11 rounded-xl bg-slate-100 relative overflow-hidden shrink-0">
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="truncate">
                        {[p.locality, p.city].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                        <IndianRupee className="w-2.5 h-2.5" />
                        {formatPrice(p.price)}
                      </span>
                      {p.status && (
                        <Badge
                          className={cn(
                            "text-[9px] px-1.5 py-0 border-none capitalize rounded-full font-bold",
                            statusColors[p.status] || "bg-slate-100 text-slate-500"
                          )}
                        >
                          {p.status}
                        </Badge>
                      )}
                    </div>
                    {link.notes && (
                      <p className="text-[10px] text-slate-400 mt-1 italic truncate">
                        {link.notes}
                      </p>
                    )}
                    
                    {/* Client-to-Client Matching UI */}
                    <div className="mt-2">
                      {matchCounts[p.id] !== undefined ? (
                        matchCounts[p.id] > 0 ? (
                          <Link href={`/properties/${p.id}/matches`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-100 group/match">
                            <Users className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{matchCounts[p.id]} Buyer Match{matchCounts[p.id] > 1 ? 'es' : ''}</span>
                            <span className="text-[10px] opacity-0 group-hover/match:opacity-100 transition-opacity ml-1">View →</span>
                          </Link>
                        ) : (
                          <Link href={`/properties/${p.id}/matches`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Run Match Engine →</span>
                          </Link>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Checking matches...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/properties/${p.id}`}>
                      <button
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View property"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleUnlink(link)}
                      disabled={removingId === link.id}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Unlink property"
                    >
                      {removingId === link.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add more button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full h-10 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Link another property
            </button>
          </>
        )}
      </div>

      <LinkPropertyToClientModal
        clientId={clientId}
        clientName={clientName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLinked={handleLinked}
      />
    </>
  )
}
