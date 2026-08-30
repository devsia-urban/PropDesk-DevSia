export const dynamic = "force-dynamic";
import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ClientForm } from "@/components/clients/client-form"
import { ClientDangerZone } from "@/components/clients/client-danger-zone"
import { getClient } from "@/lib/actions/clients"
import { notFound } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils/format"

import { requireProfile } from "@/lib/auth/get-session"

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [client, profile] = await Promise.all([
    getClient(id),
    requireProfile()
  ])

  if (!client) {
    notFound()
  }

  // Map database client to form expected payload
  const initialData = {
    id: client.id,
    full_name: client.full_name,
    phone: client.phone,
    email: client.email || "",
    looking_for: (client.looking_for as "buy" | "rent") || "buy",
    property_types: client.property_types || [],
    preferred_locations: client.preferred_locations || [],
    preferred_bhks: (client as any).preferred_bhks || [],
    budget_min: client.budget_min || undefined,
    budget_max: client.budget_max || undefined,
    priority: (client.priority as "low" | "medium" | "high") || "medium",
    min_bedrooms: client.min_bedrooms || 0,
    min_area_sqft: client.min_area_sqft || undefined,
    furnishing_preference: client.furnishing_preference || "Any",
    possession_timeline: client.possession_timeline || "Flexible",
    source: client.source || "Walk-in",
    assigned_to: client.assigned_to || "",
    notes: client.notes || "",
  }

  const isAdmin = profile?.role === 'admin' 

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href={`/clients/${id}`} 
          className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to client profile
        </Link>
        
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Edit client — {client.full_name}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Client added {formatRelativeTime(client.created_at)} by {client.assignee?.full_name || 'System'}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <ClientForm mode="edit" initialData={initialData as any} />

      {/* Danger Zone - Admin Only */}
      {isAdmin && (
        <ClientDangerZone clientId={client.id} clientName={client.full_name} clientStatus={client.status} />
      )}
    </div>
  )
}
