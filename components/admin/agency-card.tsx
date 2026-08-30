import React from "react"
import { Building2, Clock, Users, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"

export function AgencyCard({ agency }: { agency: any }) {
  const propertiesCount = agency.properties?.[0]?.count || 0
  const clientsCount = agency.clients?.[0]?.count || 0

  return (
    <Card className="flex flex-col overflow-hidden border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group rounded-[2rem] bg-white">
      <div className="p-6 flex-1 flex flex-col gap-4">
        
        {/* Header: Logo, Name, Status */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 transition-colors shadow-inner">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
            )}
          </div>
          
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-lg font-black text-slate-900 truncate tracking-tight group-hover:text-emerald-600 transition-colors">
              {agency.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn(
                "border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                agency.subscription_status === 'trial' && "bg-amber-100 text-amber-700",
                agency.subscription_status === 'active' && "bg-emerald-100 text-emerald-700",
                agency.subscription_status === 'paused' && "bg-slate-900 text-white",
                agency.subscription_status === 'expired' && "bg-red-100 text-red-700"
              )}>
                {agency.subscription_status}
              </Badge>
              {agency.subscription_end_date && (
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className={cn(
                    isPast(new Date(agency.subscription_end_date)) ? "text-red-600" : "text-slate-500"
                  )}>
                    {isPast(new Date(agency.subscription_end_date)) ? "Expired " : "Ends "}
                    {format(new Date(agency.subscription_end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mt-auto">
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-slate-900">{agency.profiles?.[0]?.count || 0}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Members</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-slate-900">{propertiesCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Props</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-slate-900">{clientsCount}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leads</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-0">
        <Link href={`/superadmin/agency/${agency.id}`}>
          <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 h-11">
            View Agency CRM
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
