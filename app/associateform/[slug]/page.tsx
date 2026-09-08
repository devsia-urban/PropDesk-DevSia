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
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agency.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.name} 
                className="h-12 w-auto object-contain rounded-lg border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl shadow-sm">
                {agency.name.charAt(0)}
              </div>
            )}
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
      <footer className="mt-20 py-8 border-t border-slate-200/50 bg-white/50 backdrop-blur-sm text-center">
        <p className="text-sm font-medium text-slate-400">
          Powered by <span className="text-slate-600 font-bold tracking-tight">DevSia</span>
        </p>
      </footer>
    </div>
  )
}
