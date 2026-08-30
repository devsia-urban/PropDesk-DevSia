export const dynamic = "force-dynamic";
import React from 'react'
import { getUnitsByScheme } from '@/lib/actions/inventory'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2, ChevronRight, MapPin, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PlotGrid from '@/components/schemes/plot-grid'

export default async function SchemeInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()

  // Get scheme with builder details
  const { data: scheme } = await supabase
    .from('schemes')
    .select('*, builder:builders(name, city, id)')
    .eq('id', id)
    .single()

  if (!scheme) return <div>Scheme not found</div>

  const units = await getUnitsByScheme(id)

  return (
    <div className="space-y-8 pb-10">
      {/* Breadcrumb / Back */}
      <div className="flex  flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/schemes/builder/${(scheme.builder as any)?.id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-[8.5px] sm:text-sm font-bold">
            <span className="text-slate-400 capitalize">{(scheme.builder as any)?.city}</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-400">{(scheme.builder as any)?.name}</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-900">{scheme.name}</span>
          </div>
        </div>
      </div>

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="md:text-3xl text-xl font-black text-slate-900 tracking-tight">{scheme.name}</h1>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[7px] md:text-[10px] font-black uppercase tracking-widest">
              Live Inventory
            </span>
          </div>
          <div className="flex items-center text-slate-400 font-bold text-sm uppercase tracking-wider">
            <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
            {scheme.location_details}
          </div>
        </div>

        <div className="flex items-center ">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="plot-search-input"
              placeholder="Search plot number..."
              className="pl-10 h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* The Map / Grid */}
      <PlotGrid units={units} schemeName={scheme.name} mapImageUrl={scheme.map_image_url} videoUrl={scheme.video_url} />


    </div>
  )
}
