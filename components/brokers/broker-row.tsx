"use client"

import React from "react"
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  Star
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
import Link from "next/link"
import { Broker } from "@/lib/types/database"
import { formatInitials } from "@/lib/utils/format"

interface BrokerRowProps {
  broker: Broker
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

export function BrokerRow({ broker, isSelected, onSelect, onDelete }: BrokerRowProps) {
  const getAvatarColor = (name: string) => {
    const firstLetter = name ? name.charAt(0).toUpperCase() : 'B'
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

  return (
    <TableRow className="group hover:bg-slate-50/50 transition-colors">
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Link href={`/brokers/${broker.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer hover:text-amber-600">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="bg-white min-w-[120px]">
              <Link href={`/brokers/${broker.id}/edit`}>
                <DropdownMenuItem className="cursor-pointer font-bold">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="text-red-500 cursor-pointer focus:text-red-500 font-bold"
                onClick={() => onDelete(broker.id)}
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
          <Avatar className={cn("h-9 w-9 border-none font-bold", getAvatarColor(broker.full_name))}>
            <AvatarFallback>{formatInitials(broker.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-900 truncate max-w-[180px]">{broker.full_name}</span>
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] text-slate-500 font-black">{broker.rating || 3}.0</span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter ">{broker.broker_type}</span>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-1.5  font-medium text-slate-600">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{broker.phones?.[0]}</span>
          </div>
          {broker.email && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Mail className="w-3 h-3 text-slate-300" />
              <span className="truncate max-w-[150px]">{broker.email}</span>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{broker.company_name || 'Independent'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-slate-400" />
            <span className=" text-slate-400 font-medium truncate max-w-[120px]">{broker.area || 'All Areas'}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {broker.specialties && broker.specialties.slice(0, 3).map((spec, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-tighter border border-slate-100 rounded"
            >
              {spec}
            </span>
          ))}
          {broker.specialties && broker.specialties.length > 3 && (
            <span className="text-[9px] text-slate-300 font-bold">+{broker.specialties.length - 3}</span>
          )}
        </div>
      </TableCell>

    </TableRow>
  )
}
