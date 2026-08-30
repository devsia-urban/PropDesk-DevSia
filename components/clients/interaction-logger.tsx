'use client'

import React, { useState, useTransition } from "react"
import { Phone, MessageSquare, Users, Pencil, Loader2, Send, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { logInteraction } from "@/lib/actions/interactions"
import { completeFollowUp } from "@/lib/actions/clients"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface InteractionLoggerProps {
  clientId: string
  hasPendingFollowUp?: boolean
}

export function InteractionLogger({ clientId, hasPendingFollowUp }: InteractionLoggerProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<'call' | 'meeting' | 'whatsapp' | 'update'>('call')
  const [overview, setOverview] = useState("")
  const [markCompleted, setMarkCompleted] = useState(!!hasPendingFollowUp)

  React.useEffect(() => {
    if (isOpen) {
      setMarkCompleted(!!hasPendingFollowUp)
    }
  }, [isOpen, hasPendingFollowUp])

  const handleSubmit = () => {
    if (!overview.trim()) {
      toast.error("Please enter a brief overview of the call/meeting")
      return
    }

    startTransition(async () => {
      const res = await logInteraction({
        clientId,
        type,
        overview
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        if (hasPendingFollowUp && markCompleted) {
          await completeFollowUp(clientId)
        }
        toast.success("Update logged & Admin notified! ✅")
        setOverview("")
        setIsOpen(false)
        setMarkCompleted(!!hasPendingFollowUp)
      }
    })
  }

  return (
    <div className="space-y-4">
      {!isOpen ? (
        <Button 
          id="log-interaction-btn"
          onClick={() => setIsOpen(true)}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Pencil className="w-4 h-4" />
          Log Call / Update
        </Button>
      ) : (
        <Card className="p-4 border-emerald-100 bg-emerald-50/30 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 px-1">Log Interaction</h4>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="w-[130px] h-8 rounded-full bg-white border-emerald-100 text-[10px] font-bold uppercase tracking-tighter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="call" className="text-[10px] font-bold uppercase">📞 Phone Call</SelectItem>
                  <SelectItem value="whatsapp" className="text-[10px] font-bold uppercase">💬 WhatsApp</SelectItem>
                  <SelectItem value="meeting" className="text-[10px] font-bold uppercase">🤝 Meeting</SelectItem>
                  <SelectItem value="update" className="text-[10px] font-bold uppercase">📝 Status Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea 
              placeholder="What was discussed? (e.g. Asked for 2BHK near metro, budget fixed...)"
              className="min-h-[100px] rounded-2xl bg-white border-emerald-100 focus:ring-emerald-500/20 text-sm italic"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />

            {hasPendingFollowUp && (
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="markCompleted"
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="markCompleted" className="text-xs font-semibold text-emerald-800">
                  Mark pending follow-up as completed
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="flex-1 h-10 rounded-xl font-bold text-slate-400"
              >
                Cancel
              </Button>
              <Button 
                disabled={isPending}
                onClick={handleSubmit}
                className="flex-2 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Log & Notify
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
