'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateSaasLead } from "@/lib/actions/saas-leads"
import { SaasLead, SaasLeadStatus } from "@/lib/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"

export function ManageSaasLeadDialog({ lead }: { lead: SaasLead }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [status, setStatus] = useState<SaasLeadStatus>(lead.status)
  const [interestLevel, setInterestLevel] = useState(lead.interest_level || "")
  const [source, setSource] = useState(lead.source || "")
  const [trialPassword, setTrialPassword] = useState(lead.trial_password || "")
  const [notes, setNotes] = useState(lead.notes || "")
  const [followUpDate, setFollowUpDate] = useState(
    lead.follow_up_date ? new Date(lead.follow_up_date).toISOString().slice(0, 16) : ""
  )
  const [eventScheduled, setEventScheduled] = useState(lead.event_scheduled || false)
  const [calledForMeeting, setCalledForMeeting] = useState(lead.called_for_meeting || false)
  const [attendedMeeting, setAttendedMeeting] = useState(lead.attended_meeting || false)
  const [reviewRequested, setReviewRequested] = useState(lead.review_requested || false)

  async function handleSave() {
    setIsSubmitting(true)
    try {
      await updateSaasLead(lead.id, {
        status,
        interest_level: interestLevel || null,
        source: source || null,
        trial_password: trialPassword || null,
        notes,
        event_scheduled: eventScheduled,
        called_for_meeting: calledForMeeting,
        attended_meeting: attendedMeeting,
        review_requested: reviewRequested,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null
      })
      toast.success("Prospect updated successfully")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to update prospect")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="w-full h-10 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-colors mt-auto"
      >
        Manage Prospect
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Manage {lead.agency_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { if (v) setStatus(v as SaasLeadStatus) }}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New Lead</SelectItem>
                  <SelectItem value="Demo Sent">Demo Sent</SelectItem>
                  <SelectItem value="Trial Started">Trial Started</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Dormant">Dormant</SelectItem>
                  <SelectItem value="OLD">OLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interest Level</Label>
              <Select value={interestLevel} onValueChange={(v) => setInterestLevel(v || "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTTEST">HOTTEST</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="not intrested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <input 
                type="text" 
                value={source} 
                onChange={(e) => setSource(e.target.value)} 
                placeholder="e.g. Ad, Youtube"
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>Trial Password</Label>
              <input 
                type="text" 
                value={trialPassword} 
                onChange={(e) => setTrialPassword(e.target.value)} 
                placeholder="e.g. Pass@123"
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Next Follow-up</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="datetime-local" 
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 pl-10 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="min-h-[80px] rounded-xl resize-none" 
              placeholder="Add details about the call or requirements..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={eventScheduled} onChange={(e) => setEventScheduled(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Event Scheduled
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={calledForMeeting} onChange={(e) => setCalledForMeeting(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Called for Meeting
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={attendedMeeting} onChange={(e) => setAttendedMeeting(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Attended Meeting
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={reviewRequested} onChange={(e) => setReviewRequested(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Review Requested
            </label>
          </div>

          <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold mt-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>

        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
