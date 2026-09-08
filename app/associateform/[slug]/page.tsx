import React from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AssociateForm } from './associate-form'

export default async function PublicAssociatePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Convert slug back to name (e.g. "aala-realtors" -> "aala realtors")
  const decodedName = decodeURIComponent(slug).replace(/-/g, ' ')

  // Use supabaseAdmin to bypass RLS and fetch public profile for ANY agency
  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .select('id, name, address, contact_phone, website, logo_url')
    .ilike('name', decodedName)
    .single()

  if (error || !agency) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-emerald-50/20 to-slate-100 relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={agency.logo_url || "/DevSia.png"}
              alt={agency.name}
              className="h-14 w-auto rounded-xl object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{agency.name}</h1>
              <p className="text-sm font-medium text-slate-500">Associate Application</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        <AssociateForm agencyId={agency.id} agencyName={agency.name} />
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-transparent text-center">
        <p className="text-sm font-medium text-slate-400">
          Powered by <span className="text-slate-600 font-bold tracking-tight">DevSia</span>
        </p>
      </footer>
    </div>
  )
}
