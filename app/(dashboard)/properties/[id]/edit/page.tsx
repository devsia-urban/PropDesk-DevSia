export const dynamic = "force-dynamic";
import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Clock } from "lucide-react"
import { PropertyForm } from "@/components/properties/property-form"
import { getProperty } from "@/lib/actions/properties"

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href={`/properties/${id}`} 
          className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to property detail
        </Link>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit property</h1>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Editing property: {property.title}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <PropertyForm initialData={property as any} mode="edit" />
    </div>
  )
}
