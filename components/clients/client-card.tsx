'use client'

import React from "react"
import {
  Sparkles,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ChevronRight,
  MapPin,
  CalendarClock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClientWithAssignee } from "@/lib/actions/clients"
import { formatBudgetRange, formatRelativeTime, formatInitials } from "@/lib/utils/format"
import { ClientStatus } from "@/lib/types/database"
import Link from "next/link"

interface ClientCardProps {
  client: ClientWithAssignee
  onDelete: (id: string) => void
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const getAvatarColor = (name: string) => {
    const firstLetter = name ? name.charAt(0).toUpperCase() : 'U'
    const colors: Record<string, string> = {
      A: "bg-purple-100 text-purple-700",
      B: "bg-blue-100 text-blue-700",
      C: "bg-emerald-100 text-emerald-700",
      D: "bg-amber-100 text-amber-700",
      E: "bg-rose-100 text-rose-700",
      F: "bg-indigo-100 text-indigo-700",
      G: "bg-cyan-100 text-cyan-700",
      H: "bg-orange-100 text-orange-700",
    }
    return colors[firstLetter] || "bg-slate-100 text-slate-700"
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    matched: "bg-amber-100 text-amber-700",
    closed: "bg-slate-100 text-slate-500",
  }

  const renderFollowUp = () => {
    if (!client.follow_up_date) return null
    const followUpDate = new Date(client.follow_up_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const compareDate = new Date(followUpDate)
    compareDate.setHours(0, 0, 0, 0)
    
    const isMissed = compareDate < now

    return (
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
        isMissed ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
      )}>
        <CalendarClock className="w-3 h-3" />
        {isMissed ? 'Missed: ' : 'Follow-up: '}
        {followUpDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>
    )
  }

  return (
    <Card className="p-4 border-slate-400 shadow-sm bg-white hover:border-emerald-100 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className={cn("h-10 w-10 border-none font-bold", getAvatarColor(client.full_name))}>
            <AvatarFallback>{formatInitials(client.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">{client.full_name}</span>
            <span className="text-xs text-slate-400 font-medium">Added {formatRelativeTime(client.created_at)}</span>
          </div>
        </div>
        <Badge className={cn("border-none px-2 py-0 text-[10px] font-bold capitalize", statusColors[client.status as string] || statusColors.active)}>
          {client.status}
        </Badge>
      </div>

      <div className="space-y-0.5 mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Phone className="w-3.5 h-3.5" />
          <span>{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium truncate">
            <Mail className="w-3.5 h-3.5" />
            <span>{client.email}</span>
          </div>
        )}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Budget: {formatBudgetRange(client.budget_min, client.budget_max)}</span>
          {renderFollowUp()}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-1">
        {client.property_types && client.property_types.map((req, i) => (
          <span
            key={i}
            className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-full border border-slate-100 whitespace-nowrap capitalize"
          >
            {req.replace('_', ' ')}
          </span>
        ))}
      </div>
      
      {/* UTM & Lead Score Badges */}
      {(client.utm_source || (client.lead_score && client.lead_score > 0)) ? (
        <div className="flex flex-wrap items-center gap-1.5 pb-1 mb-1 border-t border-slate-50 pt-2">
          {client.utm_source ? (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100 flex items-center gap-1">
              Source: {client.utm_source}
            </span>
          ) : null}
          {client.lead_score && client.lead_score > 0 ? (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-md border border-orange-100 flex items-center gap-1">
              Score: {client.lead_score}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        {(client.preferred_bhks?.length > 0 || (client.min_area_sqft && client.min_area_sqft > 0)) && (
          <div className="flex flex-wrap items-center gap-2">
            {client.preferred_bhks?.length > 0 && (
              <span className="text-[11px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">
                {client.preferred_bhks.slice().sort((a, b) => a - b).map(b => b === 5 ? "5+" : b).join(", ")} BHK
              </span>
            )}
            {(client.min_area_sqft && client.min_area_sqft > 0) ? (
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                {client.min_area_sqft.toLocaleString()} {client.min_area_unit === 'sqft' ? 'sq.ft' : client.min_area_unit || "sq.ft"}
              </span>
            ) : null}
          </div>
        )}

        {client.preferred_locations?.length > 0 && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-slate-600 line-clamp-1" title={client.preferred_locations.join(", ")}>
              {client.preferred_locations.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="pt-1 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
              {client.assignee?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-bold text-slate-500 truncate max-w-[80px]">
            {client.assignee?.full_name?.split(' ')[0] || "Unassigned"}
          </span>
        </div>


        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { logCallStart } = await import('@/lib/actions/interactions')
              await logCallStart(client.id)
              window.location.href = `tel:${client.phone}`
            }}
            className="h-8 px-3 cursor-pointer text-xs bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center gap-1.5"
          >
            <Phone className="w-3 h-3" />
            Call
          </Button>
          <Link href={`/clients/${client.id}`}>
            <Button size="sm" variant="outline" className="h-8 px-3 cursor-pointer text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(client.id)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer border border-transparent rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
