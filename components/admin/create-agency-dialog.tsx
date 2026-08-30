'use client'

import React, { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Building2, Plus, Loader2 } from "lucide-react"
import { createAgency } from "@/lib/actions/admin"
import { toast } from "sonner"

export function CreateAgencyDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    plan_type: "free" as "free" | "monthly" | "yearly",
    subscription_status: "trial" as "trial" | "active"
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createAgency(formData)
      toast.success("Agency created successfully")
      setOpen(false)
      // Reset form
      setFormData({
        name: "",
        contact_email: "",
        plan_type: "free",
        subscription_status: "trial"
      })
    } catch (error) {
      toast.error("Failed to create agency")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        id="create-agency-trigger"
        render={React.isValidElement(children) ? children : (
          <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 border-none gap-2 px-6">
            <Plus className="w-5 h-5" />
            Add New Agency
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-8">
        <DialogHeader className="space-y-3">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Building2 className="w-7 h-7" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">Create Agency</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Register a new property agency and provision their initial subscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Agency Name</Label>
            <Input 
              id="name"
              placeholder="e.g. Royal Estates"
              className="h-12 rounded-xl border-slate-100 focus-visible:ring-emerald-500"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Contact Email</Label>
            <Input 
              id="email"
              type="email"
              placeholder="admin@agency.com"
              className="h-12 rounded-xl border-slate-100 focus-visible:ring-emerald-500"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Initial Status</Label>
              <Select 
                value={formData.subscription_status}
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, subscription_status: val }))}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-100 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="trial">Free Trial</SelectItem>
                  <SelectItem value="active">Active Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Initial Plan</Label>
              <Select 
                value={formData.plan_type}
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, plan_type: val }))}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-100 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="monthly">Monthly Pro</SelectItem>
                  <SelectItem value="yearly">Yearly Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 flex !justify-between gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold text-slate-500"
            >
              Cancel
            </Button>
            <Button 
              disabled={isLoading}
              type="submit" 
              className="flex-[2] h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border-none shadow-lg gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Agency
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
