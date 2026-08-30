'use client'

import React from "react"
import Link from "next/link"
import { Phone, CalendarClock, MessageCircle, ArrowRight, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { Client } from "@/lib/types/database"
import { logCallStart, logWhatsAppStart } from "@/lib/actions/interactions"

interface FollowUpWidgetProps {
  followUps: Client[]
  title?: string
  emptyTitle?: string
  emptySub?: string
  isOverdue?: boolean
  limit?: number
  hideHeader?: boolean
  fullPage?: boolean
}

export function FollowUpWidget({ 
  followUps, 
  title = "Upcoming follow-ups", 
  emptyTitle = "No upcoming follow-ups",
  emptySub = "You have no scheduled follow-ups for now.",
  isOverdue = false,
  limit = 5,
  hideHeader = false,
  fullPage = false
}: FollowUpWidgetProps) {
  if (followUps.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", isOverdue ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500")}>
          <CalendarClock className="w-6 h-6" />
        </div>
        <h3 className="text-slate-900 font-bold mb-1">{emptyTitle}</h3>
        <p className="text-sm text-slate-500 max-w-[200px]">{emptySub}</p>
      </Card>
    )
  }

  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [actionType, setActionType] = React.useState<'call' | 'wa' | null>(null)

  const handleCall = async (clientId: string, phone: string) => {
    setLoadingId(clientId)
    setActionType('call')
    try {
      await logCallStart(clientId)
    } catch (e) {
      console.error("Failed to log call", e)
    } finally {
      setLoadingId(null)
      setActionType(null)
      window.location.href = `tel:${phone}`
    }
  }

  const handleWhatsApp = async (clientId: string, phone: string) => {
    setLoadingId(clientId)
    setActionType('wa')
    try {
      await logWhatsAppStart(clientId)
    } catch (e) {
      console.error("Failed to log WhatsApp", e)
    } finally {
      setLoadingId(null)
      setActionType(null)
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      window.location.href = `https://wa.me/${cleanPhone}`
    }
  }

  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
      {!hideHeader && (
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className={cn("w-4 h-4", isOverdue ? "text-red-500" : "text-emerald-500")} />
            {title} ({followUps.length})
          </h2>
          {!fullPage && (
            <Link href={isOverdue ? "/follow-ups?tab=overdue" : "/follow-ups?tab=upcoming"} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}
      <div className={cn("flex-1 overflow-y-auto divide-y divide-slate-50", !fullPage && "max-h-[300px]")}>
        {followUps.slice(0, limit || followUps.length).map(client => {
          const propertyType = client.property_types?.[0]?.replace(/_/g, " ") || "Property"
          const budgetText = client.budget_max ? formatCurrency(client.budget_max) : "Open budget"
          const isCalling = loadingId === client.id && actionType === 'call'
          const isMessaging = loadingId === client.id && actionType === 'wa'
          
          return (
             <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors group flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors text-sm block truncate">
                    {client.full_name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] font-medium text-slate-500">
                    <span className="capitalize">{propertyType}</span>
                    <span className="text-slate-300">•</span>
                    <span>{budgetText}</span>
                  </div>
                  {client.follow_up_date && (
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className={cn(
                          "text-[11px] font-bold",
                          new Date(client.follow_up_date) < new Date() ? "text-red-500" : "text-amber-600"
                        )}>
                          {new Date(client.follow_up_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          {", "}
                          {new Date(client.follow_up_date).toLocaleTimeString("en-IN", { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      {client.follow_up_reason && (
                        <p className="text-[10px] text-slate-500 ml-4.5 font-medium truncate">
                          • {client.follow_up_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {client.phone && (
                    <>
                      <button
                        onClick={() => handleCall(client.id, client.phone)}
                        disabled={loadingId !== null}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border-none cursor-pointer disabled:opacity-50"
                        title="Call client"
                      >
                        {isCalling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleWhatsApp(client.id, client.phone)}
                        disabled={loadingId !== null}
                        className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors shadow-sm border-none cursor-pointer disabled:opacity-50"
                        title="WhatsApp client"
                      >
                        {isMessaging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
             </div>
          )
        })}
      </div>
    </Card>
  )
}
