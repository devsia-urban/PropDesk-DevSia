import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Building2 } from 'lucide-react'
import { LeadForm } from './lead-form'

export default async function PublicLeadPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ agent?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const agentId = resolvedSearchParams?.agent || null

  // Convert slug back to name (e.g. "aala-realtors" -> "aala realtors")
  const decodedName = decodeURIComponent(slug).replace(/-/g, ' ')

  // Use supabaseAdmin to bypass RLS and fetch public profile for ANY agency
  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .select('id, name, address, contact_phone, website')
    .ilike('name', decodedName)
    .single()

  if (error || !agency) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-24">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header Profile */}
        <div className="text-center space-y-4">
          <div className=" h-30 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm mx-auto  px-4">
            <img src="/dev-sia.png" alt="DevSia" className=" h-full object-contain" />
          </div>

        </div>

        {/* Lead Form */}
        <LeadForm agencyId={agency.id} agencyName={agency.name} agentId={agentId} />

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Powered by DevSia CRM
          </p>
        </div>

      </div>
    </div>
  )
}
