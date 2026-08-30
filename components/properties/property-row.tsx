'use client'

import React from "react"
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Maximize2,
  MapPin,
  Building2,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableRow, TableCell } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Property } from "@/lib/types/database"
import { formatCurrency, formatBhk } from "@/lib/utils/format"

interface PropertyRowProps {
  property: Property
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

export function PropertyRow({ property, isSelected, onSelect, onDelete }: PropertyRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return "bg-emerald-50 text-emerald-700 border-emerald-100"
      case 'hold': return "bg-amber-50 text-amber-700 border-amber-100"
      case 'booked': return "bg-blue-50 text-blue-700 border-blue-100"
      case 'sold': return "bg-red-50 text-red-700 border-red-100"
      case 'rented': return "bg-purple-50 text-purple-700 border-purple-100"
      case 'reserved': return "bg-sky-50 text-sky-700 border-sky-100"
      default: return "bg-slate-50 text-slate-700 border-slate-100"
    }
  }

  return (
    <TableRow className="group hover:bg-slate-50/50 transition-colors">
      <TableCell className="text-right">
        <div className="flex items-center justify-center gap-0.5">
          <Link href={`/properties/${property.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer hover:text-emerald-600">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              } />
            <DropdownMenuContent align="end" className="bg-white  min-w-[120px]">
              <Link href={`/properties/${property.id}/edit`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="text-red-500 cursor-pointer focus:text-red-500"
                onClick={() => onDelete(property.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-14 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
            {property.cover_image_url ? (
              <img
                src={property.cover_image_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-300" />
              </div>
            )}
            {property.is_new && (
              <div className="absolute top-0 left-0 px-1 py-0.5 bg-blue-500 text-white text-[5px] font-black uppercase">
                New
              </div>
            )}

          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-800 truncate max-w-[210px]">{property.title}</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium line-clamp-1  max-w-[210px]">
              <MapPin className="w-2.5 h-2.5" />
              <span>{property.locality}</span>
            </div>
          </div>

        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn("px-2 py-0 border leading-none h-5 text-[9px] font-black uppercase tracking-tight w-fit", getStatusColor(property.status))}>
            {property.status}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>{property.listing_type === 'sale' ? '🏠 For Sale' : '🔑 For Rent'}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-slate-900">{formatCurrency(property.price)}</span>
          {property.price_negotiable && (
            <span className="text-[6px] text-emerald-600 font-bold uppercase tracking-tighter">Negotiable</span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Type</span>
          <span className=" font-meduim text-slate-700 capitalize">{property.property_type.replace('_', ' ')}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Area</span>
            <div className="flex items-center gap-1 text-[13px] text-slate-700">
              <Maximize2 className="w-3 h-3 text-emerald-500" />
              <span>{property.area_sqft} {property.area_unit || 'sqft'}</span>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}
