'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { createSaasLead } from "@/lib/actions/saas-leads"
import { toast } from "sonner"

const schema = z.object({
  agency_name: z.string().min(2, "Required"),
  contact_name: z.string().min(2, "Required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  city: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function CreateSaasLeadDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  async function onSubmit(data: FormData) {
    try {
      await createSaasLead({
        agency_name: data.agency_name,
        contact_name: data.contact_name,
        phone: data.phone || null,
        email: data.email || null,
        city: data.city || null,
        status: 'New'
      })
      toast.success("Lead created successfully")
      setOpen(false)
      reset()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold rounded-xl h-10 px-5"
      >
        <Plus className="w-4 h-4" />
        Add Prospect
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Agency / Company Name *</Label>
            <Input {...register("agency_name")} className="h-11 rounded-xl" placeholder="e.g. Dream Homes Realty" />
            {errors.agency_name && <p className="text-xs text-red-500">{errors.agency_name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Contact Person *</Label>
            <Input {...register("contact_name")} className="h-11 rounded-xl" placeholder="e.g. Rahul Sharma" />
            {errors.contact_name && <p className="text-xs text-red-500">{errors.contact_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input {...register("phone")} className="h-11 rounded-xl" placeholder="e.g. 9876543210" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} className="h-11 rounded-xl" placeholder="e.g. Jaipur" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} className="h-11 rounded-xl" placeholder="e.g. hello@agency.com" />
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl font-bold mt-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Prospect
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}
