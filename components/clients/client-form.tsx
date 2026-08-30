'use client'

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFormPersistence } from "@/lib/hooks/use-form-persistence"
import {
  X,
  Loader2,
  Sparkles,
  Search,
  CalendarIcon,
  AlertCircle,
  User,
  MapPin,
  Home,
  IndianRupee,
  Sofa,
  Clock,
  Phone,
  Mail,
  StickyNote,
  PersonStandingIcon,
  User2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

import { ClientFormSchema, ClientFormValues } from "@/lib/validations/client"
import { createClient, updateClient, getTeamMembers } from "@/lib/actions/clients"
import { linkClientToBroker } from "@/lib/actions/brokers"

interface ClientFormProps {
  initialData?: Partial<ClientFormValues> & { id?: string }
  mode?: "add" | "edit"
}

type TeamMember = { id: string; full_name: string; role: string }

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "flat", label: "Flat" },
  { value: "floor", label: "Builder Floor" },
  { value: "villa", label: "Villa" },
  { value: "independent_house", label: "Independent House" },
  { value: "kothi", label: "Kothi" },
  { value: "commercial", label: "Commercial" },
  { value: "plot", label: "Plot" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "farmer_land", label: "Agriculture Land" },
  { value: "penthouse", label: "Penthouse" },
]

const BHK_OPTIONS = [0, 1, 2, 3, 4, 5]

export function ClientForm({ initialData, mode = "add" }: ClientFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [locationInput, setLocationInput] = useState("")
  const [customSources, setCustomSources] = useState<string[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [newCustomSource, setNewCustomSource] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem('propdesk_custom_sources')
    if (saved) {
      setCustomSources(JSON.parse(saved))
    }
  }, [])

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      looking_for: initialData?.looking_for || "buy",
      property_types: initialData?.property_types || [],
      preferred_locations: initialData?.preferred_locations || [],
      preferred_bhks: (initialData as any)?.preferred_bhks || [],
      budget_min: initialData?.budget_min || undefined,
      budget_max: initialData?.budget_max || undefined,
      priority: initialData?.priority || "medium",
      whatsapp_number: initialData?.whatsapp_number || "",
      purpose: initialData?.purpose || "",
      ready_for_site_visit: initialData?.ready_for_site_visit || "",
      preferred_call_time: initialData?.preferred_call_time || "",
      min_bedrooms: initialData?.min_bedrooms || 0,
      min_area_sqft: initialData?.min_area_sqft,
      min_area_unit: initialData?.min_area_unit || "sqft",
      min_dimensions: initialData?.min_dimensions || "",
      preferred_commercial_type: initialData?.preferred_commercial_type || undefined,
      furnishing_preference: initialData?.furnishing_preference || "Any",
      possession_timeline: initialData?.possession_timeline || "Flexible",
      source: initialData?.source || "Walk-in",
      assigned_to: initialData?.assigned_to || "",
      notes: initialData?.notes || "",
      contact_type: (initialData as any)?.contact_type || (searchParams?.get("contact_type") as any) || "client",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const handleAddCustomSource = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    if (!newCustomSource.trim()) return
    const newSource = newCustomSource.trim()
    const updated = [...new Set([...customSources, newSource])]
    setCustomSources(updated)
    localStorage.setItem('propdesk_custom_sources', JSON.stringify(updated))
    setValue("source", newSource, { shouldDirty: true })
    setShowCustomInput(false)
    setNewCustomSource("")
  }

  const { clearSavedData } = useFormPersistence(form, `client-form-${mode}-${initialData?.id || 'new'}`)

  // Pre-fill from query params for sourcing workflow
  useEffect(() => {
    if (mode === "add" && searchParams) {
      const brokerId = searchParams.get("source_broker_id")
      if (brokerId) {
        setValue("source", "referral")
        setValue("contact_type" as any, "broker")
      }
    }
  }, [searchParams, mode, setValue])

  // Fetch real team members
  useEffect(() => {
    getTeamMembers().then(members => {
      setTeamMembers(members as TeamMember[])
    })
  }, [])

  const lookingFor = watch("looking_for")
  const propertyTypes = watch("property_types")
  const locations = watch("preferred_locations")
  const preferredBhks = watch("preferred_bhks") || []
  const minBudget = watch("budget_min")
  const maxBudget = watch("budget_max")
  const priority = watch("priority")
  const furnishing = watch("furnishing_preference")
  const minAreaUnit = watch("min_area_unit")
  const timeline = watch("possession_timeline")
  const preferredCommercialType = watch("preferred_commercial_type")
  const source = watch("source")
  const assignedTo = watch("assigned_to")
  const contactType = watch("contact_type" as any)

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)

    // Clean optional fields
    if (!data.min_bedrooms) data.min_bedrooms = 0
    if (!data.min_area_sqft || isNaN(data.min_area_sqft)) {
      data.min_area_sqft = null
      data.min_area_unit = null
    }

    if (mode === "add") {
      // Optimistically navigate and show success immediately
      toast.success("Client added! Searching for matches…")
      setTimeout(() => {
        toast.info("Matches searched for this client.", {
          description: "Based on location, budget & preferences.",
          duration: 5000,
        })
      }, 1000)
      
      const brokerId = searchParams?.get("source_broker_id")
      
      // Fire and forget server action
      createClient(data).then(async ({ data: client, error }) => {
        if (error) {
          toast.error("Failed to create client on server: " + error)
          return
        }
        if (client?.id && brokerId) {
          try {
            await linkClientToBroker(brokerId, client.id, "sourced")
          } catch (err) {
            console.error("Failed to link client to broker:", err)
          }
        }
        // Force revalidation of lists in background once done
        import("swr").then(({ mutate }) => {
          mutate((key: any) => Array.isArray(key) && key[0] === 'clientsList')
        })
      })

      clearSavedData()
      router.push("/clients")
      setIsSubmitting(false)
      return
    }

    // Update Mode (Await to handle errors or redirect properly)
    const { data: client, error } = await updateClient(initialData?.id!, data)

    if (error) {
      toast.error(error)
      setIsSubmitting(false)
      return
    }

    toast.success("Client updated successfully!")
    setIsSubmitting(false)
    clearSavedData()
    router.push(`/clients/${initialData?.id}`)
    router.refresh()
  }

  const handleDiscard = () => {
    if (isDirty) setShowDiscardDialog(true)
    else router.back()
  }

  const runSmartMatch = async () => {
    setIsMatching(true)
    toast.loading("Running match engine…", { id: "match-toast" })
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Match engine complete!", { id: "match-toast", description: "Match results updated." })
    setIsMatching(false)
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value || value === 0) return ""
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
    return `₹${value.toLocaleString()}`
  }

  const budgetDisplay = `${formatCurrency(minBudget)}${minBudget && maxBudget ? " – " : ""}${formatCurrency(maxBudget)}`

  const addLocation = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !locations.includes(trimmed)) {
      setValue("preferred_locations", [...locations, trimmed], { shouldDirty: true })
    }
    setLocationInput("")
  }

  const toggleBhk = (bhk: number) => {
    const current = preferredBhks || []
    if (current.includes(bhk)) {
      setValue("preferred_bhks", current.filter(b => b !== bhk), { shouldDirty: true })
    } else {
      setValue("preferred_bhks", [...current, bhk], { shouldDirty: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Personal Details ─────────────────────────── */}
      <FormSection icon={<User className="w-5 h-5 text-blue-500" />} title="Personal details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Full Name *" error={errors.full_name?.message}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="FULL NAME"
                {...register("full_name")}
                className={cn("h-11 rounded-xl pl-10", errors.full_name && "border-red-400")}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Phone Number *" error={errors.phone?.message}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm border-r pr-2 h-5 flex items-center">+91</span>
              <Input
                type="tel"
                placeholder="98290XXXXX"
                {...register("phone")}
                className={cn("h-11 rounded-xl pl-20", errors.phone && "border-red-400")}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="WhatsApp Number" error={errors.whatsapp_number?.message as any}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm border-r pr-2 h-5 flex items-center">+91</span>
              <Input
                type="tel"
                placeholder="Same as phone"
                {...register("whatsapp_number")}
                className="h-11 rounded-xl pl-20"
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Email Address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                placeholder="mail@example.com"
                {...register("email")}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Lead Source">
            <Select onValueChange={(v) => {
              if (v === 'add_new') {
                setShowCustomInput(true)
              } else {
                setShowCustomInput(false)
                setValue("source", v as string, { shouldDirty: true })
              }
            }} value={showCustomInput ? 'add_new' : (source || undefined)}>
              <SelectTrigger className="px-5 w-full h-11 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="cursor-pointer bg-white ">
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social media</SelectItem>
                <SelectItem value="property_portal">Property portal</SelectItem>
                <SelectItem value="cold_call">Cold call</SelectItem>
                <SelectItem value="other">Other</SelectItem>

                {customSources.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}

                {/* Ensure current source is displayed if it's not in the default or custom list */}
                {source && !['walk_in', 'referral', 'social_media', 'property_portal', 'cold_call', 'other'].includes(source) && !customSources.includes(source) && source !== 'add_new' && (
                  <SelectItem value={source}>{source}</SelectItem>
                )}

                <SelectSeparator className="bg-slate-100" />
                <SelectItem value="add_new" className="text-emerald-600 font-bold">
                  + Add custom source...
                </SelectItem>
              </SelectContent>
            </Select>

            {showCustomInput && (
              <div className="flex items-center gap-2 mt-3 animate-in slide-in-from-top-2 fade-in">
                <Input
                  autoFocus
                  placeholder="e.g. 99acres, MagicBricks"
                  value={newCustomSource}
                  onChange={e => setNewCustomSource(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSource(e); } }}
                  className="h-10 rounded-xl"
                />
                <Button type="button" onClick={handleAddCustomSource} size="sm" className="h-10 rounded-xl px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm">
                  Add
                </Button>
              </div>
            )}
          </FieldGroup>
          <FieldGroup label="Contact Type">
            <Select onValueChange={(v) => setValue("contact_type" as any, v as any, { shouldDirty: true })} value={contactType || "client"}>
              <SelectTrigger className="px-5 w-full h-11 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="client">Client (Direct)</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <div className="md:col-span-2">
            <FieldGroup label="Notes">
              <div className="relative">
                <StickyNote className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Textarea
                  placeholder="Any additional notes about this client…"
                  {...register("notes")}
                  className="rounded-xl min-h-[90px] bg-white border-slate-200 resize-none pl-10"
                />
              </div>
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* ── Property Requirements ─────────────────────── */}
      <FormSection icon={<Home className="w-5 h-5 text-amber-500" />} title="Property requirements" subtitle="Used by the smart matching engine">
        <div className="space-y-7">
          {/* Looking for */}
          <FieldGroup label="Looking for" error={errors.looking_for?.message}>
            <div className="flex gap-3 flex-wrap">
              {(["buy", "rent", "sell", "rent_owner", "lease"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue("looking_for", opt, { shouldDirty: true })}
                  className={cn(
                    "flex-1 min-w-[90px] h-11 rounded-xl font-bold text-sm transition-all border-2 capitalize",
                    lookingFor === opt
                      ? (opt === "sell" || opt === "lease" || opt === "rent_owner")
                        ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100"
                        : "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  )}
                >
                  {opt === "buy" ? "🏠 Buying" : opt === "rent" ? "🔑 Tenant" : opt === "lease" ? "📄 Leasing" : opt === "rent_owner" ? "👑 Rent Owner" : "🏷️ Selling"}
                </button>
              ))}
            </div>
            {lookingFor === "sell" && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 font-medium">
                💡 After saving, you can link specific properties from your inventory to this client on their profile page.
              </p>
            )}
          </FieldGroup>

          {/* Property Types */}
          <FieldGroup label="Property type *" error={errors.property_types?.message}>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map(({ value: t, label }) => {
                const selected = propertyTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const current = [...propertyTypes]
                      setValue("property_types",
                        selected ? current.filter(x => x !== t) : [...current, t],
                        { shouldDirty: true }
                      )
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                      selected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-400"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </FieldGroup>

          {propertyTypes.includes("commercial") && (
            <FieldGroup label="Commercial Type Preference" error={errors.preferred_commercial_type?.message}>
              <Select onValueChange={(v) => setValue("preferred_commercial_type", v === "any" ? undefined : v as any, { shouldDirty: true })} value={preferredCommercialType || "any"}>
                <SelectTrigger className="px-5 w-full h-11 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Shop / Space / Land" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="any">Any Commercial Type</SelectItem>
                  <SelectItem value="shop">Shop</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="land">Commercial Land</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}

          {/* Preferred BHK */}
          <FieldGroup label="Preferred BHK" error={errors.preferred_bhks?.message}>
            <div className="flex gap-2 flex-wrap">
              {BHK_OPTIONS.map((bhk) => {
                const selected = (preferredBhks || []).includes(bhk)
                return (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => toggleBhk(bhk)}
                    className={cn(
                      "w-12 h-11 rounded-xl text-sm font-bold transition-all border-2",
                      selected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {bhk === 5 ? "5+" : bhk === 0 ? "RK" : `${bhk}`}
                  </button>
                )
              })}
              <span className="self-center text-xs text-slate-400 font-medium">BHK</span>
            </div>
          </FieldGroup>

          {/* Preferred Locations */}
          <FieldGroup label="Preferred location(s) *" error={errors.preferred_locations?.message}>
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Type a locality and press Enter"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addLocation(locationInput)
                    }
                  }}
                  onBlur={() => locationInput.trim() && addLocation(locationInput)}
                  className="h-11 pl-10 rounded-xl"
                />
              </div>
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                      <MapPin className="w-3 h-3" />
                      {loc}
                      <button
                        type="button"
                        onClick={() => setValue("preferred_locations", locations.filter(l => l !== loc), { shouldDirty: true })}
                        className="hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FieldGroup>

          {/* Budget */}
          <FieldGroup label="Budget range *" error={errors.budget_max?.message}>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  placeholder="Min"
                  {...register("budget_min", { valueAsNumber: true })}
                  className="h-11 pl-10 rounded-xl"
                />
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  placeholder="Max"
                  {...register("budget_max", { valueAsNumber: true })}
                  className={cn("h-11 pl-10 rounded-xl", errors.budget_max && "border-red-400")}
                />
              </div>
            </div>
            {budgetDisplay && (
              <p className="mt-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 inline-block">
                {budgetDisplay}
              </p>
            )}
          </FieldGroup>

          {/* Spacing spacer */}
          <div className="h-1" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Min Area */}
            <FieldGroup label="Min Area preference *" error={errors.min_area_sqft?.message}>
              <div className="flex  gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 1200 (Optional)"
                  {...register("min_area_sqft", { valueAsNumber: true, required: false })}
                  className="h-11 rounded-xl flex-1"
                />
                <Select onValueChange={(v) => setValue("min_area_unit", v as any, { shouldDirty: true })} value={minAreaUnit}>
                  <SelectTrigger className="py-5 rounded-xl bg-white border-slate-200 w-[110px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="sqft">sq. ft</SelectItem>
                    <SelectItem value="sqyard">sq. yard</SelectItem>
                    <SelectItem value="sqm">sq. meter</SelectItem>
                    <SelectItem value="gaj">gaj</SelectItem>
                    <SelectItem value="bigha">bigha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FieldGroup>

            <FieldGroup label="Min dimensions" error={errors.min_dimensions?.message}>
              <Input
                placeholder="e.g. 20x40 (Optional)"
                {...register("min_dimensions", { required: false })}
                className="h-11 rounded-xl"
              />
            </FieldGroup>

            {/* Furnishing */}
            <FieldGroup label="Furnishing  preference">
              <Select onValueChange={(v) => setValue("furnishing_preference", v ?? undefined)} value={furnishing}>
                <SelectTrigger className="p-5 w-full rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {["Any", "Unfurnished", "Semi", "Fully furnished"].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            {/* Possession Timeline */}
            <FieldGroup label="Possession timeline">
              <Select 
                onValueChange={(v) => setValue("possession_timeline", v ?? undefined)} 
                value={
                  timeline && !["Immediate", "Within 3 months", "Within 6 months", "Within 1 year", "Flexible"].includes(timeline) 
                    ? "Custom..." 
                    : timeline
                }
              >
                <SelectTrigger className="p-5 h-full rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {["Immediate", "Within 3 months", "Within 6 months", "Within 1 year", "Flexible"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value="Custom...">Custom...</SelectItem>
                </SelectContent>
              </Select>
              
              {timeline && !["Immediate", "Within 3 months", "Within 6 months", "Within 1 year", "Flexible"].includes(timeline) && (
                <Input
                  className="mt-2 h-11 rounded-xl"
                  placeholder="E.g., After Diwali, Specific Date..."
                  value={timeline === "Custom..." ? "" : timeline}
                  onChange={(e) => setValue("possession_timeline", e.target.value)}
                  autoFocus
                />
              )}
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* ── Priority & Assignment ─────────────────────── */}
      <FormSection icon={<Clock className="w-5 h-5 text-violet-500" />} title="Priority & assignment">
        <div className="space-y-6">
          {/* Priority */}
          <FieldGroup label="Lead priority">
            <div className="flex gap-3">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("priority", p, { shouldDirty: true })}
                  className={cn(
                    "flex-1 h-11 rounded-xl font-bold text-sm transition-all border-2 capitalize",
                    priority === p
                      ? p === "high"
                        ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-100"
                        : p === "medium"
                          ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100"
                          : "bg-slate-500 border-slate-500 text-white shadow-md shadow-slate-100"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {p === "high" ? "🔴 High" : p === "medium" ? "🟡 Medium" : "⚪ Low"}
                </button>
              ))}
            </div>
          </FieldGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Assigned To */}
            <FieldGroup label="Assigned to">
              <Select onValueChange={(v) => setValue("assigned_to", v ?? undefined)} value={assignedTo}>
                <SelectTrigger className="p-5 w-full rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {teamMembers.length > 0 ? (
                    teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} {m.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled>No team members found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* ── Action Bar ───────────────────────────────── */}
      <div className="flex bg-white border-gray-500 rounded-3xl p-1 border-2  flex-col gap-3 z-30">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="flex-1 h-12 max-md:py-2 rounded-2xl font-bold text-slate-500 hover:text-slate-900 bg-white border-2 border-slate-200 hover:border-slate-300 transition-all"
            onClick={handleDiscard}
          >
            Discard changes
          </button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 h-12 max-md:py-2 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "add" ? (
              <>
                <User2 className="w-4 h-4 mr-2" />
                Add client
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>


      </div>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 text-center">Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-center pt-1">
              You have unsaved changes. Leaving this page will lose all modifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1 border-slate-200 rounded-xl font-bold h-11">Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none rounded-xl font-bold h-11"
              onClick={() => router.back()}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          {icon && <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>}
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  )
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className={cn("text-sm font-semibold text-slate-700", error && "text-red-500")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
