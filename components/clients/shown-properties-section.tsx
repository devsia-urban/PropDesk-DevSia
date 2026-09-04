'use client'

import React, { useState, useEffect, useTransition } from "react"
import { Eye, Plus, Trash2, Calendar, MapPin, Building2, MessageSquare, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getShownProperties, unlinkShownProperty, ShownProperty } from "@/lib/actions/shown-properties"
import { AddShownPropertyModal } from "./add-shown-property-modal"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface ShownPropertiesSectionProps {
  clientId: string
}

export function ShownPropertiesSection({ clientId }: ShownPropertiesSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [shownProperties, setShownProperties] = useState<ShownProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchShown = async () => {
    setIsLoading(true)
    try {
      const data = await getShownProperties(clientId)
      setShownProperties(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShown()
  }, [clientId])

  const handleUnlink = (id: string, propertyTitle: string) => {
    if (!confirm(`Are you sure you want to remove ${propertyTitle} from this client's shown history?`)) return

    startTransition(async () => {
      const res = await unlinkShownProperty(id, clientId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Property removed from shown list")
        fetchShown()
      }
    })
  }

  return (
    <Card className="border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Properties shown</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold border-none">
            {shownProperties.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="p-1.5 cursor-pointer rounded-lg text-emerald-600 hover:bg-emerald-300 border border-emerald-300"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading history...</p>
          </div>
        ) : shownProperties.length > 0 ? (
          <div className="space-y-4">
            {shownProperties.map((record) => {
              const isExternal = !record.property
              const title = isExternal ? "External Property" : record.property?.title
              const location = isExternal ? "Unknown Location" : (record.property?.locality || record.property?.city)
              const price = isExternal ? null : record.property?.price
              const coverImage = isExternal ? null : record.property?.cover_image_url

              return (
                <div key={record.id} className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all">
                  {/* Property Icon/Indicator */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-sm transition-colors group-hover:bg-white overflow-hidden">
                    {coverImage ? (
                      <img src={coverImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Building2 className={cn("w-5 h-5", isExternal ? "text-amber-400" : "text-slate-300")} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {!isExternal ? (
                          <Link href={`/properties/${record.property?.id}`} className="block">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight line-clamp-1">
                              {title}
                            </p>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">
                              {title}
                            </p>
                            <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black uppercase px-1 py-0">External</Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {price && <span className="text-xs font-black text-emerald-600">{formatCurrency(price)}</span>}
                          {location && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                              <MapPin className="w-3 h-3" />
                              {location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-slate-400 md:hover:text-red-500"
                                onClick={() => handleUnlink(record.id, title || "Property")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            } />
                            <TooltipContent className="bg-slate-900 text-white border-none">Remove from history</TooltipContent>
                          </Tooltip>

                          {!isExternal && (
                            <Tooltip>
                              <TooltipTrigger render={
                                <Link href={`/properties/${record.property?.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer md:hover:text-emerald-600">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              } />
                              <TooltipContent className="bg-slate-900 text-white border-none">View Property</TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Feedback/Notes */}


                    {/* Date Shown */}
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      <span>Shown on {new Date(record.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-200/50">
              <Eye className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">No properties shown yet</p>
            <p className="text-xs text-slate-400 font-medium mt-1 max-w-[200px]">Keep track of every property you show to this client.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 h-10 px-6 rounded-xl border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-50 transition-all"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Link First Property
            </Button>
          </div>
        )}
      </div>

      <AddShownPropertyModal
        clientId={clientId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchShown}
      />
    </Card>
  )
}
