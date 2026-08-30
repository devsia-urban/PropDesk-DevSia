'use client'

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getBrokers, linkPropertyToBroker } from "@/lib/actions/brokers"
import { Broker } from "@/lib/types/database"
import { toast } from "sonner"
import { Handshake, Loader2, Share2 } from "lucide-react"

interface SharePropertyModalProps {
  propertyId: string
  propertyName: string
  isOpen: boolean
  onClose: () => void
}

export function SharePropertyModal({ propertyId, propertyName, isOpen, onClose }: SharePropertyModalProps) {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selectedBroker, setSelectedBroker] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      getBrokers().then(res => setBrokers(res?.data || []))
    }
  }, [isOpen])

  const handleShare = async () => {
    if (!selectedBroker) {
      toast.error("Please select a broker")
      return
    }

    setIsLoading(true)
    try {
      const result = await linkPropertyToBroker(selectedBroker, propertyId, 'shared', notes)
      if (result.error) throw new Error(result.error)

      toast.success("Property shared with broker successfully")
      onClose()
      setSelectedBroker("")
      setNotes("")
    } catch (error: any) {
      toast.error(error.message || "Failed to share property")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white overflow-x-auto rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Handshake className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">Share Property</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Record that you've shared <span className="text-slate-900 font-bold">"{propertyName}"</span> with an external partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Broker</Label>
            <Select value={selectedBroker} onValueChange={(v) => setSelectedBroker(v || "")}>
              <SelectTrigger className="h-12 line-clamp-1 bg-slate-50 border-none rounded-2xl font-bold text-slate-700">
                <SelectValue placeholder="Choose a partner..." />
              </SelectTrigger>
              <SelectContent className="bg-white font-bold">
                {brokers.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.full_name} {b.company_name ? `(${b.company_name})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Collaborator Notes</Label>
            <Textarea
              placeholder="e.g. Shared for their client Mr. Sharma..."
              className="bg-slate-50 border-none rounded-2xl min-h-[100px] p-4 text-slate-700 font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-12 rounded-xl font-bold text-slate-500"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading}
            onClick={handleShare}
            className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Record Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
