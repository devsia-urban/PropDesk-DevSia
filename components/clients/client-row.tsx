'use client'

import React from "react"
import {
  MoreVertical,
  Copy,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CalendarClock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableRow, TableCell } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Link from "next/link"

import { ClientWithAssignee } from "@/lib/actions/clients"
import { formatBudgetRange, formatRelativeTime, formatInitials } from "@/lib/utils/format"
import { RelativeTime } from "@/components/ui/relative-time"



interface ClientRowProps {
  client: ClientWithAssignee
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

export function ClientRow({ client, isSelected, onSelect, onDelete }: ClientRowProps) {
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



  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard`)
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
        "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1",
        isMissed ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
      )}>
        <CalendarClock className="w-3 h-3" />
        {isMissed ? 'Missed: ' : 'Follow-up: '}
        {followUpDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>
    )
  }

  return (
    <TableRow className="group hover:bg-slate-50/50 transition-colors">

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/clients/${client.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer hover:text-emerald-600">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <MoreVertical className="w-4 h-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="bg-white min-w-[120px]">
              <Link href={`/clients/${client.id}/edit`} className="w-full">
                <DropdownMenuItem className="cursor-pointer">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-slate-100 " />
              <DropdownMenuItem
                className="text-red-500 cursor-pointer focus:text-red-500"
                onClick={() => onDelete(client.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>




      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className={cn("h-9 w-9 border-none font-bold", getAvatarColor(client.full_name))}>
            <AvatarFallback>{formatInitials(client.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="font-medium text-slate-800">{client.full_name}</span>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              Added <RelativeTime date={client.created_at} />
            </div>
            {renderFollowUp()}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col space-y-0.5 group/contact max-w-[200px]">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span>{client.phone}</span>
            <button
              onClick={() => copyToClipboard(client.phone, "Phone number")}
              className="opacity-0 group-hover/contact:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
            >
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <span className="text-xs text-slate-500 truncate">{client.email || 'No email provided'}</span>
        </div>
      </TableCell>

      <TableCell>
        <span className="text-sm font-medium text-slate-700">{formatBudgetRange(client.budget_min, client.budget_max)}</span>
      </TableCell>

      <TableCell>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider shrink-0",
          client.looking_for === "buy"
            ? "bg-emerald-50 text-emerald-700"
            : (client.looking_for === "sell" || client.looking_for === "rent_owner" || client.looking_for === "lease")
            ? "bg-amber-50 text-amber-700"
            : "bg-blue-50 text-blue-700"
        )}>
          {client.looking_for === "buy" ? "🏠 Buying" : client.looking_for === "rent" ? "🔑 Tenant" : client.looking_for === "lease" ? "📄 Leasing" : client.looking_for === "rent_owner" ? "👑 Rent Owner" : "🏷️ Selling"}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
              {client.assignee?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
            {client.assignee?.full_name || "Unassigned"}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
          {client.property_types && client.property_types.map((req: string, i: number) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap capitalize"
            >
              {req.replace('_', ' ')}
            </span>
          ))}
          {client.preferred_locations && client.preferred_locations.slice(0, 2).map((loc: string, i: number) => (
            <span
              key={`loc-${i}`}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap capitalize"
            >
              {loc}
            </span>
          ))}
        </div>
      </TableCell>

      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(client.id, !!checked)}
          className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
        />
      </TableCell>


    </TableRow>
  )
}
