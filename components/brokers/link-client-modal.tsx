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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getClients } from "@/lib/actions/clients"
import { linkClientToBroker } from "@/lib/actions/brokers"
import { Client } from "@/lib/types/database"
import { toast } from "sonner"
import { Search, Loader2, User, Check, Handshake } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "use-debounce"

interface LinkClientModalProps {
  brokerId: string
  brokerName: string
  isOpen: boolean
  onClose: () => void
}

export function LinkClientModal({ brokerId, brokerName, isOpen, onClose }: LinkClientModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch] = useDebounce(searchTerm, 400)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search clients when debounced search term changes
  useEffect(() => {
    if (isOpen) {
      setIsSearching(true)
      getClients({ search: debouncedSearch, status: 'all' })
        .then(res => {
          setClients(res?.data || [])
        })
        .finally(() => setIsSearching(false))
    }
  }, [debouncedSearch, isOpen])

  const handleLink = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await linkClientToBroker(brokerId, selectedClientId, 'shared', notes)
      if (result.error) throw new Error(result.error)
      
      toast.success("Client lead recorded as shared successfully")
      onClose()
      setSelectedClientId(null)
      setNotes("")
      setSearchTerm("")
    } catch (error: any) {
      toast.error(error.message || "Failed to link client")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-[2rem] border-none shadow-2xl p-8 max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Handshake className="w-6 h-6 text-indigo-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">Record Shared Client</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Search for a client to record that you've shared this lead with <span className="text-slate-900 font-bold">{brokerName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2 -mr-2">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Search Clients</Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search by name, phone or email..."
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl font-medium text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Leads</Label>
            <div className="grid gap-2">
              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs font-bold">Finding clients...</p>
                </div>
              ) : clients.length > 0 ? (
                clients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left group",
                      selectedClientId === c.id 
                        ? "bg-indigo-50 border-indigo-500" 
                        : "bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-100"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold text-sm truncate",
                        selectedClientId === c.id ? "text-indigo-900" : "text-slate-700"
                      )}>{c.full_name}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">{c.phone} • {c.email || 'No email'}</p>
                    </div>
                    {selectedClientId === c.id && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <User className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-bold">No clients found</p>
                </div>
              )}
            </div>
          </div>

          {selectedClientId && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Collaboration Agreement</Label>
              <Textarea 
                placeholder="Optional: Commission terms or specific requirements for the broker..."
                className="bg-slate-50 border-none rounded-2xl min-h-[100px] p-4 text-slate-700 font-medium"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-slate-50">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-12 rounded-xl font-bold text-slate-500 cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            disabled={isSubmitting || !selectedClientId}
            onClick={handleLink}
            className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex items-center gap-2 shadow-xl shadow-slate-200 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
            Record Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
