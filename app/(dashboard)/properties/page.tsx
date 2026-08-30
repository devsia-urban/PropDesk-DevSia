export const dynamic = "force-dynamic";
import React from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { PropertyList } from "@/components/properties/property-list"
import { getProperties } from "@/lib/actions/properties"
import { getProfile } from "@/lib/auth/get-session"

interface PropertiesPageProps {
  searchParams: Promise<{
    search?: string
    property_type?: string
    status?: string
    listing_type?: string
    approval_type?: string
    bhk?: string
    price_min?: string
    price_max?: string
    page?: string
  }>
}

export default async function PropertiesPage(props: PropertiesPageProps) {
  const profile = await getProfile()
  const isReadOnly = profile?.subscription_status === 'paused' && !profile?.is_super_admin
  
  // Default empty filters for server-side prefetch
  const filtersKey = {
    search: '',
    status: 'available',
    property_type: 'any',
    listing_type: 'any',
    approval_type: 'any',
    bhk: 'any',
    price_min: undefined,
    price_max: undefined,
    page: 1,
  }
  const initialData = await getProperties(filtersKey)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Properties</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your property portfolio</p>
        </div>
        {!isReadOnly && (
          <Link
            href="/properties/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl h-10 px-5 flex items-center gap-2 font-bold"
            )}
          >
            <Plus className="w-4 h-4" />
            Add property
          </Link>
        )}
      </div>

      <PropertyList initialData={initialData} />
    </div>
  )
}
