'use client'

import React, { useEffect, useState } from "react"
import { Phone, MessageSquare, Users, Pencil, History as HistoryIcon, Clock } from "lucide-react"
import { getInteractions } from "@/lib/actions/interactions"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface InteractionHistoryProps {
  clientId: string
}

export function InteractionHistory({ clientId }: InteractionHistoryProps) {
  const [interactions, setInteractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      const data = await getInteractions(clientId)
      setInteractions(data)
      setLoading(false)
    }
    fetchHistory()
  }, [clientId])

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-3 h-3" />
      case 'whatsapp': return <MessageSquare className="w-3 h-3" />
      case 'meeting': return <Users className="w-3 h-3" />
      default: return <Pencil className="w-3 h-3" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'call': return "bg-blue-50 text-blue-500 border-blue-100"
      case 'whatsapp': return "bg-emerald-50 text-emerald-500 border-emerald-100"
      case 'meeting': return "bg-purple-50 text-purple-500 border-purple-100"
      default: return "bg-slate-50 text-slate-500 border-slate-100"
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-400 text-xs font-bold animate-pulse uppercase tracking-widest">Loading history...</div>

  if (interactions.length === 0) return (
    <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
      <HistoryIcon className="w-8 h-8 text-slate-300" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No history yet</p>
    </div>
  )

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-emerald-100 before:via-slate-100 before:to-transparent">
      {interactions.map((item) => (
        <div key={item.id} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
          {/* Timeline Dot & Icon */}
          <div className={cn(
            "relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 border-white",
            getColor(item.type)
          )}>
            {getIcon(item.type)}
          </div>

          {/* Content Card */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {item.agent?.full_name || "Unknown Agent"}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </div>
            </div>

            <div className="bg-white border border-slate-50 p-4 rounded-2xl rounded-tl-none shadow-sm group hover:border-emerald-100 transition-all">
              <p className="text-sm text-slate-700 leading-relaxed italic">
                &quot;{item.overview}&quot;
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
