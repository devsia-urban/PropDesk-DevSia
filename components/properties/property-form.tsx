'use client'

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFormPersistence } from "@/lib/hooks/use-form-persistence"
import {
  Plus,
  Minus,
  ImagePlus,
  X,
  Loader2,
  AlertCircle,
  Building2,
  Check,
  Star,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Video,
  MapPin
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { uploadImageAction } from "@/lib/actions/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PropertyFormSchema, PropertyFormValues } from "@/lib/validations/property"
import { createProperty, updateProperty } from "@/lib/actions/properties"
import { getBrokers } from "@/lib/actions/brokers"
import { Broker } from "@/lib/types/database"
import {
  getAgencyAmenities,
  addAgencyAmenity,
  getAgencyApprovalTypes,
  addAgencyApprovalType,
  getAgencyPlotGroups,
  addAgencyPlotGroup
} from "@/lib/actions/options"
import { formatBudget } from "@/lib/utils/format"

interface PropertyFormProps {
  initialData?: Partial<PropertyFormValues> & { id?: string }
  mode?: "add" | "edit"
}

const DEFAULT_AMENITIES = [
  "Swimming Pool", "Gym", "Clubhouse", "Park", "Security 24/7",
  "Power Backup", "Car Parking", "CCTV", "Lift", "Fire Safety",
  "Gas Pipeline", "Jogging Track", "Intercom", "Maintenance Staff"
]

const DEFAULT_APPROVALS = ["JDA", "HB", "Society", "90B"]

const DEFAULT_PLOT_GROUPS = ["JDA Scheme", "Gated Society", "JDA Patta", "Society Patta"]

const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"]

export function PropertyForm({ initialData, mode = "add" }: PropertyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)

  const [dbAmenities, setDbAmenities] = useState<string[]>([])
  const [dbApprovalTypes, setDbApprovalTypes] = useState<string[]>([])
  const [dbPlotGroups, setDbPlotGroups] = useState<string[]>([])
  const [customAmenity, setCustomAmenity] = useState("")
  const [isAddingAmenity, setIsAddingAmenity] = useState(false)
  const [customApproval, setCustomApproval] = useState("")
  const [isAddingApproval, setIsAddingApproval] = useState(false)
  const [isOtherApproval, setIsOtherApproval] = useState(false)
  const [customPlotGroup, setCustomPlotGroup] = useState("")
  const [isAddingPlotGroup, setIsAddingPlotGroup] = useState(false)
  const [isOtherPlotGroup, setIsOtherPlotGroup] = useState(false)

  const [brokers, setBrokers] = useState<Broker[]>([])

  // Fetch global options
  useEffect(() => {
    const fetchOptions = async () => {
      const [amenities, approvals, plotGroups] = await Promise.all([
        getAgencyAmenities(),
        getAgencyApprovalTypes(),
        getAgencyPlotGroups()
      ])
      const brokersData = await getBrokers({ page: 1 })
      setDbAmenities(amenities)
      setDbApprovalTypes(approvals)
      setDbPlotGroups(plotGroups)
      setBrokers(Array.isArray(brokersData) ? brokersData : (brokersData.data || []))
    }
    fetchOptions()
  }, [])

  const amenitiesOptions = Array.from(new Set([...DEFAULT_AMENITIES, ...dbAmenities]))
  const approvalOptions = Array.from(new Set([...DEFAULT_APPROVALS, ...dbApprovalTypes]))
  const plotGroupOptions = Array.from(new Set([...DEFAULT_PLOT_GROUPS, ...dbPlotGroups]))

  // Map initialData ensuring nulls from DB are handled correctly for the form
  const defaultValues: PropertyFormValues = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    property_type: initialData?.property_type || "apartment",
    status: initialData?.status || "available",
    listing_type: initialData?.listing_type || "sale",
    price: initialData?.price || 0,
    price_negotiable: initialData?.price_negotiable ?? false,
    locality: initialData?.locality || "",
    city: initialData?.city || "",
    address: initialData?.address || "",
    bhk: initialData?.bhk || [],
    bedrooms: initialData?.bedrooms || 0,
    bathrooms: initialData?.bathrooms || 0,
    area_sqft: initialData?.area_sqft || 0,
    area_unit: initialData?.area_unit || "sqft",
    road_info: initialData?.road_info || "",
    furnishing: initialData?.furnishing || null,
    pincode: initialData?.pincode || "",
    floor_number: initialData?.floor_number || "",
    total_floors: initialData?.total_floors || "",
    facing: initialData?.facing || "",
    parking: initialData?.parking || "",
    maintenance_charge: initialData?.maintenance_charge || 0,
    cover_image_url: initialData?.cover_image_url || "",
    image_urls: initialData?.image_urls || [],
    // New fields
    seller_name: initialData?.seller_name || (mode === "add" ? searchParams.get("seller_name") || "" : ""),
    seller_phone: initialData?.seller_phone || (mode === "add" ? searchParams.get("seller_phone") || "" : ""),
    approval_type: initialData?.approval_type || "",
    group: (initialData as any)?.group || "",
    slug: initialData?.slug || "",
    is_featured: initialData?.is_featured ?? false,
    is_new: initialData?.is_new ?? true,
    amenities: initialData?.amenities || [],
    balconies: initialData?.balconies || 0,
    google_maps_url: initialData?.google_maps_url || "",
    video_url: initialData?.video_url || "",
    source_broker_id: initialData?.source_broker_id || (mode === "add" ? searchParams.get("source_broker_id") || "" : ""),
    contact_type: (initialData?.contact_type || (mode === "add" ? searchParams.get("contact_type") || "client" : "client")) as any,
  }

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(PropertyFormSchema) as any,
    defaultValues: defaultValues as any,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const { clearSavedData } = useFormPersistence(form, `property-form-${mode}-${initialData?.id || 'new'}`)

  const propertyTypeValue = watch("property_type")
  const statusValue = watch("status")
  const listingTypeValue = watch("listing_type")
  const approvalTypeValue = watch("approval_type")
  const areaUnitValue = watch("area_unit")
  const furnishingValue = watch("furnishing")
  const bedroomsValue = watch("bedrooms") || 0
  const bathroomsValue = watch("bathrooms") || 0
  const negotiableValue = watch("price_negotiable")
  const imageUrls = watch("image_urls") || []
  const coverImageUrl = watch("cover_image_url")
  const isFeatured = watch("is_featured")
  const isNew = watch("is_new")
  const selectedAmenities = watch("amenities") || []
  const bhkValues = watch("bhk") || []
  const groupValue = (watch as any)("group")
  const videoUrlValue = watch("video_url")
  const contactTypeValue = watch("contact_type")
  const sourceBrokerId = watch("source_broker_id")

  // Auto-generate slug from title if empty
  const titleValue = watch("title")
  useEffect(() => {
    // Live-generate slug from title (same logic as server's toSlug)
    if (mode === "add" && titleValue) {
      const generatedSlug = titleValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
        .replace(/[\s_]+/g, '-')         // spaces to hyphens
        .replace(/-+/g, '-')             // collapse hyphens
        .replace(/^-+|-+$/g, '')         // trim hyphens
      setValue("slug", generatedSlug || undefined)
    }
  }, [titleValue, setValue, mode])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }
    
    const loadingToast = toast.loading("Getting current location...")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const url = `https://maps.google.com/?q=${latitude},${longitude}`
        setValue("google_maps_url", url, { shouldDirty: true, shouldValidate: true })
        toast.dismiss(loadingToast)
        toast.success("Location added successfully!")
      },
      (error) => {
        toast.dismiss(loadingToast)
        toast.error("Failed to get location. Check permissions.")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true)
    try {
      // ── Clean Data ──
      const cleanedData = { ...data }

      // Server handles slug uniqueness — no need to add a suffix here

      const fieldsToNullify = [
        'bedrooms', 'bathrooms', 'balconies',
        'maintenance_charge', 'area_sqft',
        'floor_number', 'total_floors',
        'parking', 'facing', 'road_info',
        'seller_name', 'seller_phone', 'approval_type'
      ] as const

      fieldsToNullify.forEach(field => {
        const val = (cleanedData as any)[field]
        if (val === 0 || val === "" || val === "0" || val === undefined || (typeof val === 'number' && isNaN(val))) {
          (cleanedData as any)[field] = null
        }
      })

      // If area is null, nullify unit too
      if (cleanedData.area_sqft === null) {
        cleanedData.area_unit = null
      }

      // If land, set furnishing to null
      if (propertyTypeValue === "plot" || propertyTypeValue === "farmhouse" || propertyTypeValue === "farmer_land") {
        cleanedData.furnishing = null
      } else if (cleanedData.furnishing === ("null" as any)) {
        cleanedData.furnishing = null
      }

      if (mode === "add") {
        clearSavedData()
        toast.success("Property listed successfully!")
        
        // Fire and forget
        createProperty(cleanedData).then((result) => {
          if (result.error) {
            toast.error("Server error: " + result.error)
          } else {
            import("swr").then(({ mutate }) => {
              mutate((key: any) => Array.isArray(key) && key[0] === 'propertiesList')
            })
          }
        })
        
        router.push("/properties")
        setIsSubmitting(false)
        return
      }

      // Edit Mode
      const result = await updateProperty(initialData?.id!, cleanedData)

      if (result.error) {
        toast.error(result.error)
      } else {
        clearSavedData()
        toast.success("Property updated successfully!")
        router.push("/properties")
        router.refresh()
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = 5 - imageUrls.length
    const filesToUpload = files.slice(0, remainingSlots)

    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s). Extra images were ignored.`)
    }

    setUploadingImage(true)
    const newUploadedUrls: string[] = []

    try {
      // Process uploads sequentially to prevent server overload
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)
        
        const result = await uploadImageAction(formData)
        
        if (result.error || !result.url) {
          toast.error(`Failed to upload ${file.name}`)
          continue
        }
        
        newUploadedUrls.push(result.url)
      }

      if (newUploadedUrls.length > 0) {
        const newUrls = [...imageUrls, ...newUploadedUrls]
        setValue("image_urls", newUrls, { shouldDirty: true })

        if (!coverImageUrl || coverImageUrl.startsWith('data:image')) {
          setValue("cover_image_url", newUrls[0], { shouldDirty: true })
        }
        
        toast.success(`${newUploadedUrls.length} image(s) uploaded successfully!`)
      }
    } catch (error: any) {
      console.error("⛔ [UPLOAD] Server Action Failure:", error)
      toast.error(error.message || "Something went wrong during upload")
    } finally {
      setUploadingImage(false)
      e.target.value = '' // Reset input
    }
  }

  const removeImage = (urlToRemove: string) => {
    const newUrls = imageUrls.filter(url => url !== urlToRemove)
    setValue("image_urls", newUrls, { shouldDirty: true })
    if (coverImageUrl === urlToRemove) {
      setValue("cover_image_url", newUrls[0] || "", { shouldDirty: true })
    }
  }

  const toggleAmenity = (amenity: string) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity]
    setValue("amenities", next, { shouldDirty: true })
  }

  const handleAddCustomAmenity = async () => {
    if (!customAmenity.trim()) return
    setIsAddingAmenity(true)
    const res = await addAgencyAmenity(customAmenity.trim())
    if (res.error) {
      toast.error(res.error)
    } else {
      setDbAmenities(prev => [...prev, customAmenity.trim()])
      toggleAmenity(customAmenity.trim())
      setCustomAmenity("")
      toast.success("Added to global amenities")
    }
    setIsAddingAmenity(false)
  }

  const handleAddCustomApproval = async () => {
    if (!customApproval.trim()) return
    setIsAddingApproval(true)
    const res = await addAgencyApprovalType(customApproval.trim())
    if (res.error) {
      toast.error(res.error)
    } else {
      setDbApprovalTypes(prev => [...prev, customApproval.trim()])
      setValue("approval_type", customApproval.trim(), { shouldDirty: true })
      setCustomApproval("")
      setIsOtherApproval(false)
      toast.success("Added to global approval types")
    }
    setIsAddingApproval(false)
  }

  const handleAddCustomPlotGroup = async () => {
    if (!customPlotGroup.trim()) return
    setIsAddingPlotGroup(true)
    const res = await addAgencyPlotGroup(customPlotGroup.trim())
    if (res.error) {
      toast.error(res.error)
    } else {
      setDbPlotGroups(prev => [...prev, customPlotGroup.trim()])
      setValue("group" as any, customPlotGroup.trim(), { shouldDirty: true })
      setCustomPlotGroup("")
      setIsOtherPlotGroup(false)
      toast.success("Added to global plot groups")
    }
    setIsAddingPlotGroup(false)
  }

  const toggleBhk = (val: number) => {
    const next = bhkValues.includes(val)
      ? bhkValues.filter(b => b !== val)
      : [...bhkValues, val].sort((a, b) => a - b)
    setValue("bhk", next, { shouldDirty: true })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardDialogOpen(true)
    } else {
      router.back()
    }
  }

  const confirmDiscard = () => {
    setIsDiscardDialogOpen(false)
    router.back()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-4">

          <Section title="Basic Info">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className={cn("flex items-center gap-1", errors.title && "text-red-500")}>
                  Property Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. 3BHK Luxury Apartment"
                  {...register("title")}
                  className={cn(errors.title && "border-red-500")}
                />
                {errors.title && <p className="text-xs text-red-500 font-bold">{errors.title.message}</p>}
              </div>

              {/* Dynamically adjusts the grid so things never get cramped */}
              <div className={cn(
                "grid gap-4",
                propertyTypeValue === "commercial"
                  ? "grid-cols-1 sm:grid-cols-2 " // 2x2 grid on medium screens, 4-inline on huge screens
                  : "grid-cols-1 sm:grid-cols-2"                // Standard 3-inline layout
              )}>

                {/* min-w-0 prevents the grid column from overflowing */}
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="listing_type" className="truncate">Listing Type</Label>
                  <Select onValueChange={(v) => setValue("listing_type", v as any, { shouldDirty: true })} value={listingTypeValue}>
                    {/* w-full ensures the trigger stays exactly within the column */}
                    <SelectTrigger className="bg-emerald-50 border-none font-bold text-emerald-700 w-full">
                      <SelectValue placeholder="Sale/Rent" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="lease">For Lease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="property_type" className="flex items-center gap-1 truncate">
                    Property Type <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(v) => setValue("property_type", v as any, { shouldDirty: true })} value={propertyTypeValue}>
                    <SelectTrigger className={cn("w-full", errors.property_type && "border-red-500")}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="floor">Builder Floor</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="independent_house">Independent House</SelectItem>
                      <SelectItem value="kothi">Kothi</SelectItem>
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="farmhouse">Farmhouse</SelectItem>
                      <SelectItem value="farmer_land">Agriculture Land</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.property_type && <p className="text-xs text-red-500 font-bold">{errors.property_type.message}</p>}
                </div>

                {propertyTypeValue === "commercial" && (
                  <div className="grid gap-2 min-w-0 animate-in fade-in zoom-in-95 duration-200">
                    <Label htmlFor="commercial_type" className="flex items-center gap-1 truncate">
                      Commercial Type <span className="text-red-500">*</span>
                    </Label>
                    <Select onValueChange={(v) => setValue("commercial_type", v as any, { shouldDirty: true })} value={watch("commercial_type") || ""}>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="space">Space</SelectItem>
                        <SelectItem value="land">Commercial Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="status" className="flex items-center gap-1 truncate">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(v) => setValue("status", v as any, { shouldDirty: true })} value={statusValue}>
                    <SelectTrigger className="border border-slate-200 text-black w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="hold">Hold (24hrs)</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-xs text-red-500 font-bold">{errors.status.message}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className={cn("flex items-center gap-1", errors.description && "text-red-500")}>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the property..."
                  rows={4}
                  {...register("description")}
                  className={cn("rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all", errors.description && "border-red-500")}
                />
                {errors.description && <p className="text-xs text-red-500 font-bold">{errors.description.message}</p>}
              </div>
            </div>
          </Section>

          <Section title="Specifications">
            <div className="space-y-4">
              {/* Area & Measurement Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* area */}
                <div className="grid gap-2">
                  <Label>Area & Measurement</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Area"
                      {...register("area_sqft", { valueAsNumber: true })}
                      className="flex-1 min-w-0 "
                    />
                    <Select onValueChange={(v) => setValue("area_unit", v as any, { shouldDirty: true })} value={areaUnitValue}>
                      <SelectTrigger className="w-28 bg-slate-50 border-none font-medium shrink-0">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="sqft">Sq. Ft</SelectItem>
                        <SelectItem value="sqyard">Sq. Yard</SelectItem>
                        <SelectItem value="sqm">Sq. Meter</SelectItem>
                        <SelectItem value="gaj">Gaj</SelectItem>
                        <SelectItem value="bigha">Bigha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dimension Size */}
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="dimensions">Size</Label>
                  <Input id="dimensions" placeholder="e.g. 20x40" {...register("dimensions")} className="w-full" />
                </div>
                {/* road Info */}
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="road_info">Road Info</Label>
                  <Input id="road_info" placeholder="e.g. 40ft wide" {...register("road_info")} className="w-full" />
                </div>
                {/* Facing */}
                <div className="grid gap-2">
                  <Label htmlFor="facing">Facing Direction</Label>
                  <Select onValueChange={(v) => setValue("facing", v, { shouldDirty: true })} value={watch("facing") || ""}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Direction" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {FACING_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/*  */}


              {/* Approval & Slug Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                {propertyTypeValue !== "plot" && <div className="grid gap-2">
                  <Label htmlFor="approval_type">Approval Authority</Label>
                  {isOtherApproval ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom authority"
                        value={customApproval}
                        onChange={(e) => setCustomApproval(e.target.value)}
                        className="bg-emerald-50 border-emerald-100 placeholder:text-slate-300 flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomApproval}
                        disabled={isAddingApproval}
                        className="bg-emerald-500 hover:bg-emerald-600 h-10 px-3 shrink-0"
                      >
                        {isAddingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOtherApproval(false)}
                        className="h-10 w-10 shrink-0 text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      onValueChange={(v) => {
                        if (v === "other") {
                          setIsOtherApproval(true)
                        } else {
                          setValue("approval_type", v, { shouldDirty: true })
                        }
                      }}
                      value={approvalTypeValue}
                    >
                      <SelectTrigger className="bg-blue-50 border-none font-bold text-blue-700 w-full">
                        <SelectValue placeholder="Select Authority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white font-bold">
                        <SelectItem value="" className="text-slate-400 italic">None / Select</SelectItem>
                        {approvalOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                        <SelectItem value="other" className="text-emerald-600 font-black">+ Add Other Type</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>}

                {propertyTypeValue === "plot" && (
                  <div className="grid gap-2 pt-2">
                    <Label htmlFor="group">Plot Group (Category)</Label>
                    {isOtherPlotGroup ? (
                      <div className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                        <Input
                          placeholder="Name of society/scheme"
                          value={customPlotGroup}
                          onChange={(e) => setCustomPlotGroup(e.target.value)}
                          className="bg-orange-50 border-orange-100 placeholder:text-slate-300 flex-1 min-w-0"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCustomPlotGroup}
                          disabled={isAddingPlotGroup}
                          className="bg-orange-500 hover:bg-orange-600 h-10 px-3 shrink-0"
                        >
                          {isAddingPlotGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsOtherPlotGroup(false)}
                          className="h-10 w-10 shrink-0 text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(v) => {
                          if (v === "other") {
                            setIsOtherPlotGroup(true)
                          } else {
                            setValue("group" as any, v, { shouldDirty: true })
                          }
                        }}
                        value={groupValue}
                      >
                        <SelectTrigger className="bg-orange-50 border-none font-bold text-orange-700 w-full">
                          <SelectValue placeholder="Select Group" />
                        </SelectTrigger>
                        <SelectContent className="bg-white font-bold">
                          <SelectItem value="" className="text-slate-400 italic">None / Select</SelectItem>
                          {plotGroupOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                          <SelectItem value="other" className="text-orange-600 font-black">+ Add Custom Group</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}


                <div className="grid gap-2">
                  <Label htmlFor="slug" className="flex items-center gap-1">
                    Property Slug (URL) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="slug" placeholder="e.g. luxury-3bhk-villa" {...register("slug")} className={cn("w-full", errors.slug && "border-red-500")} />
                  {errors.slug && <p className="text-xs text-red-500 font-bold">{errors.slug.message}</p>}
                </div>
              </div>



              {/* Plot Group Row (conditional) */}

              {/* BHK & Property Details (conditional) */}
              {!(propertyTypeValue === "plot" || propertyTypeValue === "farmer_land") && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      BHK Options
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Multi-Select</span>
                    </Label>
                    <div className="flex flex-wrap  gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => toggleBhk(num)}
                          className={cn(
                            "h-10 px-4 rounded-xl border text-sm font-bold transition-all",
                            bhkValues.includes(num)
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
                              : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30"
                          )}
                        >
                          {num === 0 ? "RK" : `${num} BHK`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input id="bedrooms" type="number" {...register("bedrooms", { valueAsNumber: true })} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input id="bathrooms" type="number" {...register("bathrooms", { valueAsNumber: true })} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="balconies">Balconies</Label>
                      <Input id="balconies" type="number" {...register("balconies", { valueAsNumber: true })} className="w-full" />
                    </div>

                  </div>

                  <div className="grid grid-cols-2  md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">

                    <div className="grid gap-2">
                      <Label htmlFor="floor_number">Floor Number</Label>
                      <Input id="floor_number" placeholder="e.g. 4th" {...register("floor_number")} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="total_floors">Total Floors</Label>
                      <Input id="total_floors" placeholder="e.g. 10" {...register("total_floors")} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="furnishing">Furnishing</Label>
                      <Select onValueChange={(v) => setValue("furnishing", v as any, { shouldDirty: true })} value={furnishingValue || "null"}>
                        <SelectTrigger className={cn("w-full", !furnishingValue && "text-slate-400 font-medium")}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="null" className="text-slate-400 italic">None / NA</SelectItem>
                          <SelectItem value="unfurnished">Unfurnished</SelectItem>
                          <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                          <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>
          <Section title="Location">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="locality" className="flex items-center gap-1">
                  Locality <span className="text-red-500">*</span>
                </Label>
                <Input id="locality" placeholder="e.g. Mansarovar" {...register("locality")} className={cn(errors.locality && "border-red-500")} />
                {errors.locality && <p className="text-xs text-red-500 font-bold">{errors.locality.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city" className="flex items-center gap-1">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input id="city" placeholder="e.g. Jaipur" {...register("city")} className={cn(errors.city && "border-red-500")} />
                {errors.city && <p className="text-xs text-red-500 font-bold">{errors.city.message}</p>}
              </div>
              <div className="grid gap-2 text-left">
                <Label htmlFor="pincode" className="flex items-center gap-1">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input id="pincode" placeholder="e.g. 302001" {...register("pincode")} className={cn(errors.pincode && "border-red-500")} />
                {errors.pincode && <p className="text-xs text-red-500 font-bold">{errors.pincode.message}</p>}
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea id="address" placeholder="Complete property address..." rows={2} {...register("address")} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="google_maps_url" className="flex items-center justify-between">
                  <span>Location Link (Google Maps / WhatsApp)</span>
                  <button 
                    type="button" 
                    onClick={handleGetCurrentLocation}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    Get Current Location
                  </button>
                </Label>
                <Input id="google_maps_url" placeholder="https://goo.gl/maps/... or WhatsApp location link" {...register("google_maps_url")} />
                <p className="text-[10px] text-slate-400 italic">Paste a Google Maps or WhatsApp location link, or click "Get Current Location" to use your GPS.</p>
              </div>
            </div>
          </Section>

          <Section title="Seller / Owner Details">
            <p className="text-xs text-slate-400 -mt-2 mb-3 font-medium">
              Enter the direct owner or seller contact. This will appear prominently on the property page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seller_name">Seller / Owner Name</Label>
                <Input
                  id="seller_name"
                  placeholder="e.g. Ramesh Sharma"
                  {...register("seller_name")}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seller_phone">Seller / Owner Phone</Label>
                <Input
                  id="seller_phone"
                  placeholder="+91 98765 43210"
                  {...register("seller_phone")}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_type">Source Type</Label>
                <Select onValueChange={(v) => setValue("contact_type" as any, v as any, { shouldDirty: true })} value={contactTypeValue || "null"}>
                  <SelectTrigger className={cn(!contactTypeValue && "text-slate-400 font-medium")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="null" className="text-slate-400 italic">None / NA</SelectItem>
                    <SelectItem value="client">Client (Direct)</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="coloniser">Coloniser</SelectItem>
                    <SelectItem value="builder">Builder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contactTypeValue === "broker" && (
                <div className="grid gap-2 animate-in slide-in-from-left-2 duration-300">
                  <Label htmlFor="source_broker_id" className="flex items-center gap-1">
                    Select Source Broker
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("source_broker_id", v, { shouldDirty: true })}
                    value={sourceBrokerId || ""}
                  >
                    <SelectTrigger className="bg-amber-50 border-none font-bold text-amber-700">
                      <SelectValue placeholder="Search or select broker" />
                    </SelectTrigger>
                    <SelectContent className="bg-white w font-bold">
                      <SelectItem value="" className="text-slate-400 italic">None / Unknown</SelectItem>
                      {brokers?.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.full_name} {b.company_name ? `(${b.company_name})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-amber-600 italic">Linking this will show the broker as the primary point of contact.</p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Amenities">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left",
                      selectedAmenities.includes(item)
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      selectedAmenities.includes(item) ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                    )}>
                      {selectedAmenities.includes(item) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Add custom amenity (e.g. Solar Panels)"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      className="pl-9 bg-slate-50 border-none focus:bg-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomAmenity()
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    disabled={isAddingAmenity || !customAmenity.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 h-10 px-4 font-bold text-xs shrink-0 rounded-xl shadow-lg shadow-emerald-100"
                  >
                    {isAddingAmenity ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Global"}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1 italic flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Custom amenities are saved to your agency's library for future use.
                </p>
              </div>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <Section title="Status & Badges">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-slate-900">Featured Property</Label>
                      <p className="text-[10px] text-slate-500">Show on the homepage</p>
                    </div>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={(c) => setValue("is_featured", c, { shouldDirty: true })} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-slate-900">New Listing</Label>
                      <p className="text-[10px] text-slate-500">Add 'NEW' badge icon</p>
                    </div>
                  </div>
                  <Switch checked={isNew} onCheckedChange={(c) => setValue("is_new", c, { shouldDirty: true })} />
                </div>
              </div>
            </Section>

            <Section title="Pricing">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label className={cn(errors.price && "text-red-500")}>Price (₹) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Total Price"
                    {...register("price", { valueAsNumber: true })}
                    className={cn(errors.price && "border-red-500 h-12 text-lg font-bold text-emerald-600")}
                  />
                  {watch("price") > 0 && (
                    <p className="text-xs font-black text-emerald-600/80 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
                      ≈ {formatBudget(watch("price")).replace("L", " Lacs").replace("Cr", " Crores")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={negotiableValue} onCheckedChange={(checked) => setValue("price_negotiable", checked, { shouldDirty: true })} />
                  <Label className="font-bold text-slate-700">Price negotiable</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maintenance_charge">Maintenance / Month (₹)</Label>
                  <Input
                    id="maintenance_charge"
                    type="number"
                    placeholder="Maintenance fee"
                    {...register("maintenance_charge", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </Section>

            <Section title="Property Media">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="video_url" className="flex items-center gap-2">
                    Video Link (YouTube/Insta/Drive)
                    <Video className="w-3.5 h-3.5 text-blue-500" />
                  </Label>
                  <Input 
                    id="video_url" 
                    placeholder="https://..." 
                    {...register("video_url")}
                    className={cn("bg-blue-50 border-none font-medium placeholder:text-blue-300", errors.video_url && "border-red-500")}
                  />
                  {errors.video_url && <p className="text-xs text-red-500 font-bold">{errors.video_url.message}</p>}
                </div>
                
                <div className="pt-2">
                  <Label className="mb-2 block">Property Images</Label>
                <div className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors",
                  imageUrls.length >= 5
                    ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"
                    : "border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className={cn("absolute inset-0 opacity-0", imageUrls.length >= 5 ? "cursor-not-allowed" : "cursor-pointer")}
                    onChange={handleImageSelect}
                    disabled={uploadingImage || imageUrls.length >= 5}
                  />
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                  ) : (
                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                  )}
                  <p className="text-xs text-slate-500 font-medium">
                    {uploadingImage ? "Uploading..." : imageUrls.length >= 5 ? "Maximum 5 images reached" : "Click to upload images (Max 5)"}
                  </p>
                </div>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {imageUrls.map((url, i) => {
                      const isCover = coverImageUrl === url
                      return (
                        <div key={url} className={cn(
                          "aspect-square rounded-lg relative overflow-hidden group border transition-all",
                          isCover ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" : "border-slate-200"
                        )}>
                          <Image src={url} alt={`Property ${i + 1}`} fill className="object-cover" loading="lazy" />

                          {isCover && (
                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-in zoom-in-50 duration-300">
                              COVER
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setValue("cover_image_url", url, { shouldDirty: true })}
                              className={cn(
                                "bg-white rounded-full p-2 text-slate-600 hover:text-emerald-500 transition-colors shadow-xl",
                                isCover && "text-emerald-500 bg-white"
                              )}
                              title={isCover ? "Current cover image" : "Set as cover image"}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(url)}
                              className="bg-white rounded-full p-2 text-slate-600 hover:text-red-500 transition-colors shadow-xl"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                </div>
              </div>
            </Section>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isSubmitting || uploadingImage} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none h-12 text-base font-bold rounded-xl shadow-lg shadow-emerald-100">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "edit" ? "Save Changes" : "Publish Property →"}
              </Button>
            </div>
          </div>
        </div>
      </div>

    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
        {title}
      </h3>
      {children}
    </Card>
  )
}
