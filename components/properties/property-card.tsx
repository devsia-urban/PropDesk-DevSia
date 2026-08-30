'use client'

import React, { useTransition } from "react"
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  Star,
  Zap
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Property, PropertyStatus } from "@/lib/types/database"
import { deleteProperty } from "@/lib/actions/properties"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils/format"

interface PropertyCardProps {
  property: Property
  viewMode: "grid" | "list"
}

const statusColors: Record<PropertyStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  hold: "bg-amber-100 text-amber-700",
  booked: "bg-blue-100 text-blue-700",
  sold: "bg-red-100 text-red-700",
  rented: "bg-purple-100 text-purple-700",
  reserved: "bg-sky-100 text-sky-700",
}

export function PropertyCard({ property, viewMode }: PropertyCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()


  const formatBhk = (bhk: number[] | null | undefined) => {
    if (!bhk || !Array.isArray(bhk) || bhk.length === 0) return null
    const sorted = [...bhk].sort((a, b) => a - b)
    if (sorted.length === 1) return `${sorted[0]} BHK`
    return `${sorted.join(", ")} BHK`
  }

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteProperty(property.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Property deleted successfully")
        router.refresh()
      }
    })
  }

  // // console.log(property);

  const coverImage = property.cover_image_url || null

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-slate-300 p-3 flex gap-4 items-center group hover:bg-slate-50 transition-colors">
        <div className="w-24 h-24 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden relative">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={property.title}
              fill
              className="object-contain"
            />
          ) : (
            <Building2 className="w-8 h-8 text-slate-300" />
          )}
          <Badge className={cn("absolute top-1 left-1 text-[10px] px-1.5 py-0 border-none", statusColors[property.status])}>
            {property.status}
          </Badge>
          {property.is_featured && (
            <div className="absolute top-1 right-1 bg-orange-400 p-0.5 rounded-md shadow-sm">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 font-sans truncate">{property.title}</h3>
              {property.is_new && (
                <div className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded uppercase tracking-tighter shadow-sm animate-pulse">
                  NEW
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-emerald-600 font-bold leading-tight">{formatPrice(property.price)}</p>
              <p className="text-[10px] text-slate-400 capitalize font-medium">{property.listing_type} · {property.approval_type || 'General'}</p>
            </div>
          </div>

          <div className="flex items-center text-slate-500 text-xs mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[150px] sm:max-w-none">{property.locality}, {property.city}</span>
            {(property.group && (property.property_type === 'plot' || property.property_type === 'farmhouse' || property.property_type === 'farmer_land')) && (
              <span className="ml-2 text-orange-600 font-bold border-l border-slate-200 pl-2 shrink-0">
                {property.group}
              </span>
            )}
            {(property as any).profiles?.full_name && (
              <span className="ml-2 text-slate-400 font-medium border-l border-slate-200 pl-2 truncate max-w-[120px]">
                By {(property as any).profiles.full_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-xs">
            {formatBhk(property.bhk) && (
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
                <span>{formatBhk(property.bhk)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="capitalize">{property.area_sqft} {(property.area_unit || 'sqft').replace('sq', 'sq. ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 pl-4 border-l border-slate-100">
          <Link href={`/properties/${property.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-emerald-600")}>
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/properties/${property.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-blue-600")}>
            <Pencil className="w-4 h-4" />
          </Link>
          <DeleteDialog propertyTitle={property.title} onDelete={handleDelete} isPending={isPending} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col group bg-white rounded-xl border border-slate-400 overflow-hidden hover:shadow-md transition-all relative">
      <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={property.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Building2 className="w-12 h-12 text-slate-300" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn("border-none shadow-sm", statusColors[property.status])}>
            {property.status}
          </Badge>
          {property.is_new && (
            <div className="h-6 px-2 bg-blue-500 text-white text-[10px] font-black rounded flex items-center justify-center gap-1 shadow-md">
              <Zap className="w-3 h-3 fill-white" />
              NEW
            </div>
          )}
        </div>
        {property.is_featured && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md border border-orange-100">
            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <p className="text-xl font-bold text-slate-900">{formatPrice(property.price)}</p>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{property.listing_type}</span>
          </div>
          <h3 className="text-sm font-semibold font-sans text-slate-700 truncate group-hover:text-emerald-600 transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center  text-slate-500 text-sm">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <div className="line-clamp-1">
              {property.locality}
            </div>
            {(property.approval_type || property.group) && (
              <span className="ml-2 text-[10px] font-bold text-slate-400 capitalize bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit shrink-0">
                ✓ {property.group || property.approval_type}
              </span>
            )}
            {(property as any).profiles?.full_name && (
              <span className="ml-2 text-slate-400 text-xs font-medium border-l border-slate-200 pl-2 truncate max-w-[100px]">
                By {(property as any).profiles.full_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-sm">
          {formatBhk(property.bhk) && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-900 font-bold">{formatBhk(property.bhk)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-900 font-bold capitalize">{property.area_sqft} {property.area_unit}</span>
          </div>
        </div>

        <Separator className="bg-slate-50" />

        <div className="flex items-center  gap-2 pt-1">
          <Link href={`/properties/${property.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 text-xs h-8 bg-emerald-300 border-slate-200  text-slate-600 hover:bg-emerald-50 rounded-lg")}>
            View Details
          </Link>
          <Link href={`/properties/${property.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 hover:bg-sky-500 hover:text-slate-100 text-blue-600 transition-colors")}>
            <Pencil className="w-4 h-4" />
          </Link>
          <DeleteDialog propertyTitle={property.title} onDelete={handleDelete} isPending={isPending} />
        </div>
      </div>
    </div>
  )
}

function DeleteDialog({ propertyTitle, onDelete, isPending }: { propertyTitle: string, onDelete: () => void, isPending: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8  text-red-500 cursor-pointer hover:text-white  hover:bg-red-500 transition-colors"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        }
      />
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Move to trash?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want delelte <strong>"{propertyTitle}"</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            render={<Button variant="outline" className="border-slate-200 rounded-lg cursor-pointer px-6 h-10" />}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isPending}
            className="bg-red-500 cursor-pointer text-white hover:bg-red-600 border-none rounded-lg px-6 h-10 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              "Move to trash"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function PropertyCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-3 flex gap-4 items-center">
        <div className="w-24 h-24 rounded-lg bg-slate-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded" />
            <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
          </div>
          <div className="h-3 w-1/3 bg-slate-50 animate-pulse rounded" />
          <div className="h-3 w-1/4 bg-slate-50 animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col border border-slate-100 rounded-xl overflow-hidden">
      <div className="aspect-video bg-slate-100 animate-pulse" />
      <div className="p-4 bg-white space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-1/3 bg-slate-100 animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-slate-50 animate-pulse rounded" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-10 bg-slate-50 animate-pulse rounded" />
          <div className="h-4 w-10 bg-slate-50 animate-pulse rounded" />
          <div className="h-4 w-10 bg-slate-50 animate-pulse rounded" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-8 w-8 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-8 w-8 bg-slate-100 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}
