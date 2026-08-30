export const dynamic = "force-dynamic";
import React from 'react'
import { getSchemesByBuilder } from '@/lib/actions/inventory'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2, ChevronRight, MapPin, Grid, Layers, Maximize2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function BuilderSchemesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  const { data: builder } = await supabase.from('builders').select('*').eq('id', id).single()
  const schemes = await getSchemesByBuilder(id)

  if (!builder) return <div>Builder not found</div>

  return (
    <div className="space-y-8 pb-10">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-3">
        <Link href={`/schemes/city/${builder.city.toLowerCase()}`}>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
          <span className="text-slate-400">Cities</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-400 capitalize">{builder.city}</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900">{builder.name}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm">
            {builder.logo_url ? (
              <img src={builder.logo_url} alt={builder.name} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-10 h-10 text-slate-200" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">{builder.name}</h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium mt-1">Explore townships and residential schemes by this builder.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-slate-900 text-white border-none py-1.5 px-4 rounded-full font-bold">
            {schemes.length} active schemes
          </Badge>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {schemes.length > 0 ? (
          schemes.map((scheme) => (
            <Link key={scheme.id} href={`/schemes/view/${scheme.id}`} className="group block">
              <Card className="h-full border-none shadow-xl shadow-slate-200/50 hover:shadow-emerald-500/10 rounded-[2.5rem] overflow-hidden bg-white transition-all duration-700 hover:-translate-y-2 relative">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Visual Header */}
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                    {scheme.map_image_url ? (
                      <img
                        src={scheme.map_image_url}
                        alt={scheme.name}
                        className="w-full m-0 p-0 h-full object-cover  group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-emerald-100/30">
                        <Layers className="w-12 h-12 text-emerald-200" />
                      </div>
                    )}

                    {/* Glass Badge */}
                    <div className="absolute top-4 left-4">
                      {/* <div className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
                        Residential Scheme
                      </div> */}
                    </div>

                    {/* Quick View Icon */}

                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-6 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors truncate">
                          {scheme.name}
                        </h3>
                        <div className="flex items-center text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                          <span className="truncate">{scheme.location_details || 'Prime Development Area'}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed ">
                      {scheme.description || 'Experience luxury living in this meticulously planned township featuring wide internal roads, smart utilities, and extensive green spaces designed for a modern lifestyle.'}
                    </p>

                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tabular-nums leading-none">
                          {scheme.total_units}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Units</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button className="rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <Layers className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No active schemes found for this builder.</p>
          </div>
        )}
      </div>
    </div>
  )
}
