'use client'

import React from "react"
import Link from "next/link"
import {
  Phone,
  Mail,
  MapPin,
  Star,
  Building,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Handshake
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Broker } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface BrokerCardProps {
  broker: Broker & {
    _count?: { properties: number }
  }
}

export function BrokerCard({ broker }: BrokerCardProps) {
  const primaryPhone = broker.phones?.[0] || ""

  const whatsappUrl = primaryPhone
    ? `https://wa.me/${primaryPhone.replace(/\D/g, '')}`
    : null

  return (
    <Card className="group relative bg-white border-slate-200 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden border-2 hover:border-amber-200">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:bg-amber-100 transition-colors duration-500 -z-0" />

      <div className="relative z-10 space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
              {broker.broker_type === 'freelance' ? 'Freelance' : 'Agency'}
            </Badge>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              {broker.full_name}
            </h3>
            {broker.company_name && (
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                <Building className="w-3 h-3" />
                {broker.company_name}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < broker.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {broker.area && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-sm font-semibold">{broker.area}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
              <Phone className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <span className="text-sm font-bold tabular-nums">
              {primaryPhone ? primaryPhone : "No contact"}
            </span>
          </div>
        </div>

        {/* Specialty Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {broker.specialties?.slice(0, 3).map(specialty => (
            <span
              key={specialty}
              className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg group-hover:bg-white group-hover:text-amber-700 transition-colors border border-transparent group-hover:border-amber-100"
            >
              {specialty}
            </span>
          ))}
          {broker.specialties?.length > 3 && (
            <span className="text-[10px] font-bold text-slate-400 px-1 pt-1">
              +{broker.specialties.length - 3} more
            </span>
          )}
        </div>

        <div className="pt-4 flex items-center gap-2">
          <Link href={`/brokers/${broker.id}`} className="flex-1">
            <Button
              variant="outline"
              className="w-full cursor-pointer h-12 rounded-2xl border-2 border-slate-500 text-slate-700 font-bold hover:bg-slate-500 hover:text-slate-100 group/btn"
            >
              View Profile
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button
                size="icon"
                className="h-12 w-12 cursor-pointer rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
