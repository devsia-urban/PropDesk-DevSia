'use client'

import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Briefcase, MapPin, User, Mail, Phone, Building2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitAssociateApplication } from '@/lib/actions/associates'
import Confetti from 'react-confetti'

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name is required." }),
  mobile_number: z.string().min(10, { message: "Valid mobile number is required." }),
  whatsapp_number: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  city: z.string().min(2, { message: "City is required." }),
  experience_level: z.string().min(1, { message: "Please select experience level." }),
  property_types: z.string().min(1, { message: "Please enter property types you deal in." }),
  preferred_working_location: z.string().min(2, { message: "Preferred location is required." }),
  current_occupation: z.string().min(2, { message: "Current occupation is required." }),
  works_with_other_company: z.boolean(),
  other_company_name: z.string().optional(),
  deals_closed_last_year: z.string().optional()
}).refine(data => {
  if (data.works_with_other_company && (!data.other_company_name || data.other_company_name.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please enter the company name",
  path: ["other_company_name"]
});

type FormValues = z.infer<typeof formSchema>

export function AssociateForm({ agencyId, agencyName }: { agencyId: string, agencyName: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  React.useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      mobile_number: "",
      whatsapp_number: "",
      email: "",
      city: "",
      experience_level: "",
      property_types: "",
      preferred_working_location: "",
      current_occupation: "",
      works_with_other_company: false,
      other_company_name: "",
      deals_closed_last_year: ""
    },
  })

  const worksWithOtherCompany = form.watch("works_with_other_company")

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)

    // Convert comma-separated property types to array
    const propertyTypesArray = data.property_types.split(',').map(s => s.trim()).filter(s => s !== "")

    const res = await submitAssociateApplication({
      agency_id: agencyId,
      full_name: data.full_name,
      mobile_number: data.mobile_number,
      whatsapp_number: data.whatsapp_number || null,
      email: data.email || null,
      city: data.city,
      experience_level: data.experience_level,
      property_types: propertyTypesArray,
      preferred_working_location: data.preferred_working_location,
      current_occupation: data.current_occupation,
      works_with_other_company: data.works_with_other_company,
      other_company_name: data.works_with_other_company ? data.other_company_name : null,
      deals_closed_last_year: data.deals_closed_last_year || null
    })

    setIsSubmitting(false)

    if (res.error) {
      alert(res.error)
    } else {
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-16 animate-in zoom-in-95 duration-500">
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100/50">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
        <p className="text-lg text-slate-600 max-w-md mx-auto">
          Thank you for applying to join <strong>{agencyName}</strong> as an Associate. Our team will review your application and get back to you shortly!
        </p>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
      <CardHeader className="bg-slate-900 text-white p-8 sm:p-10">
        <CardTitle className="text-2xl sm:text-3xl font-playfair tracking-tight">Become an Associate</CardTitle>
        <CardDescription className="text-slate-300 text-base">
          Fill out the details below to apply and join our real estate network.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <User className="w-5 h-5 text-emerald-500" /> Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" placeholder="John Doe" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("full_name")} />
                {form.formState.errors.full_name && <p className="text-sm text-red-500">{form.formState.errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input id="mobile_number" placeholder="+91 9876543210" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("mobile_number")} />
                {form.formState.errors.mobile_number && <p className="text-sm text-red-500">{form.formState.errors.mobile_number.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input id="whatsapp_number" placeholder="Optional" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("whatsapp_number")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">City of Residence *</Label>
                <Input id="city" placeholder="E.g., Mumbai, Delhi" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("city")} />
                {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Briefcase className="w-5 h-5 text-blue-500" /> Professional Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select onValueChange={(val) => form.setValue("experience_level", val as string)}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher (0 years)</SelectItem>
                    <SelectItem value="1-3">1 to 3 Years</SelectItem>
                    <SelectItem value="3-5">3 to 5 Years</SelectItem>
                    <SelectItem value="5+">5+ Years</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.experience_level && <p className="text-sm text-red-500">{form.formState.errors.experience_level.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_types">Property Types Handled *</Label>
                <Input id="property_types" placeholder="E.g., Residential, Commercial, Plots" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("property_types")} />
                {form.formState.errors.property_types && <p className="text-sm text-red-500">{form.formState.errors.property_types.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="preferred_working_location">Preferred Working Location / Areas *</Label>
                <Input id="preferred_working_location" placeholder="E.g., South Delhi, Bandra" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("preferred_working_location")} />
                {form.formState.errors.preferred_working_location && <p className="text-sm text-red-500">{form.formState.errors.preferred_working_location.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_occupation">Current Occupation *</Label>
                <Input id="current_occupation" placeholder="E.g., Real Estate Broker, Insurance Agent" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("current_occupation")} />
                {form.formState.errors.current_occupation && <p className="text-sm text-red-500">{form.formState.errors.current_occupation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deals_closed_last_year">Deals Closed Last Year</Label>
                <Input id="deals_closed_last_year" placeholder="Approximate number (optional)" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("deals_closed_last_year")} />
              </div>

              <div className="space-y-4 md:col-span-2 pt-4">
                <Label className="text-base font-semibold">Do you currently work with another Real Estate Company?</Label>
                <RadioGroup
                  defaultValue="false"
                  onValueChange={(val) => form.setValue("works_with_other_company", val === "true")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {worksWithOtherCompany && (
                <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="other_company_name">Company Name *</Label>
                  <Input id="other_company_name" placeholder="Name of the company you work with" className="h-12 rounded-xl bg-slate-50 border-slate-200" {...form.register("other_company_name")} />
                  {form.formState.errors.other_company_name && <p className="text-sm text-red-500">{form.formState.errors.other_company_name.message}</p>}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </span>
            ) : (
              "Submit Application"
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
