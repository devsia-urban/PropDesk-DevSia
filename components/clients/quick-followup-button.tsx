'use client'

import React, { useState } from "react"
import { Calendar as CalendarIcon, Clock, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateClient, completeFollowUp } from "@/lib/actions/clients"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface QuickFollowupButtonProps {
  clientId: string
  currentDate?: string | null
  currentReason?: string | null
}

export function QuickFollowupButton({ clientId, currentDate, currentReason }: QuickFollowupButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [date, setDate] = useState(currentDate ? format(new Date(currentDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState(currentDate ? format(new Date(currentDate), "HH:mm") : "10:00")
  const [reason, setReason] = useState(currentReason || "")
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    try {
      // Combine date and time
      const followUpDateTime = new Date(`${date}T${time}:00`).toISOString()

      const { error } = await updateClient(clientId, {
        follow_up_date: followUpDateTime as any, // Cast to any to satisfy the Zod/TS requirement if it expects Date
        follow_up_reason: reason || null
      })

      if (error) {
        toast.error(error)
      } else {
        toast.success("Follow-up scheduled!")
        setOpen(false)
        router.refresh()
      }
    } catch (err) {
      toast.error("Invalid date or time")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    const btn = document.getElementById('log-interaction-btn')
    if (btn) {
      btn.click()
      // Smooth scroll to it
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      {currentDate && (
        <Button
          onClick={handleComplete}
          variant="outline"
          className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
        >
          Completed
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className={currentDate ? "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm" : "w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"}
            >
              <CalendarIcon className="w-4 h-4 text-emerald-500" />
              {currentDate ? "Reschedule" : "Set Follow-up"}
            </button>
          }
        />
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule Follow-up
            </DialogTitle>
            <p className="text-emerald-100 text-sm">Pick a date and time to contact this lead</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason (Optional)</Label>
            <Input
              id="reason"
              placeholder="e.g. Call, Site Visit, Docs"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-2 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Follow-up"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  )
}
