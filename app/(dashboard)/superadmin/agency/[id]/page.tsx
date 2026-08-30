export const dynamic = "force-dynamic";
import React from "react"
import { notFound } from "next/navigation"
import { requireSuperAdmin } from "@/lib/auth/get-session"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AgencyCRMTabs } from "./agency-crm-tabs"

export default async function AgencyCRMPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const { id } = await params

  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .select('*, profiles(count), properties(count), clients(count), schemes(count)')
    .eq('id', id)
    .single()

  if (error || !agency) {
    return notFound()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">

      {/* Back Button */}
      <Link href="/superadmin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Agencies
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-24 h-24 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm p-4">
          {agency.logo_url ? (
            <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-10 h-10 text-slate-300" />
          )}
        </div>
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
            {agency.name}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            Joined {new Date(agency.created_at).toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>

      {/* Client Component Tabs */}
      <AgencyCRMTabs agency={agency} />
    </div>
  )
}
