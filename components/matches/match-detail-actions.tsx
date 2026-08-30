'use client'

import React, { useState } from "react"
import { CheckCheck, Phone, Share2, X, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateMatchStatus } from "@/lib/actions/matches"
import { MatchStatus } from "@/lib/types/database"
import { toast } from "sonner"

interface MatchDetailActionsProps {
  matchId: string
  currentStatus: MatchStatus
  footer?: boolean
}

export function MatchDetailActions({ matchId, currentStatus, footer }: MatchDetailActionsProps) {
  const [status, setStatus] = useState<MatchStatus>(currentStatus)

  const handleStatus = async (newStatus: MatchStatus) => {
    setStatus(newStatus)
    const result = await updateMatchStatus(matchId, newStatus)
    if (result.error) {
      toast.error("Failed to update status")
      setStatus(currentStatus)
    } else {
      const labels: Record<MatchStatus, string> = {
        reviewed: "Match marked as reviewed",
        contacted: "Contact logged successfully",
        dismissed: "Match dismissed",
        new: "Match reset to new",
      }
      if (newStatus === 'dismissed') {
        toast.error(labels[newStatus])
      } else {
        toast.success(labels[newStatus])
      }
    }
  }

  if (footer) {
    return (
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => handleStatus('reviewed')}
          className="flex-1 sm:flex-none h-11 px-6 rounded-xl cursor-pointer border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:text-slate-900 shadow-sm"
        >
          <CheckCheck className="w-4 h-4 mr-2 text-emerald-500" />
          Mark as reviewed
        </Button>

        {/* <Button
          variant="ghost"
          onClick={() => handleStatus('dismissed')}
          className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
        >
          <X className="w-4 h-4 mr-2" />
          Dismiss match
        </Button> */}
      </div>
    )
  }

  // Header dropdown
  return (
    <div className="flex items-center gap-2">
      <div className="sm:hidden">
        <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-lg capitalize">
          {status}
        </Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl shadow-sm">
            <MoreVertical className="w-5 h-5" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="bg-white min-w-48 p-1.5 shadow-xl border-slate-100 rounded-xl">
          <DropdownMenuItem onClick={() => handleStatus('reviewed')} className="rounded-lg py-2.5 font-bold text-xs text-slate-600 cursor-pointer">
            Mark as reviewed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatus('contacted')} className="rounded-lg py-2.5 font-bold text-xs text-slate-600 cursor-pointer">
            Mark as contacted
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatus('dismissed')} className="rounded-lg py-2.5 font-bold text-xs text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50">
            Dismiss match
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
