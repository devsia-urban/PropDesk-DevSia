export const dynamic = "force-dynamic";
import React from 'react'
import { getBuildersByCity } from '@/lib/actions/inventory'
import Link from 'next/link'
import { ArrowLeft, Building2, ChevronRight, Globe, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function CityBuildersPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const builders = await getBuildersByCity(city)

  return (
    <div className="space-y-8 pb-10">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-3">
        <Link href="/schemes">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-slate-400">Schemes</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900 capitalize">{city}</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize">
          Builders in {city}
        </h1>
        <p className="text-slate-500 max-sm:text-sm font-medium mt-1">Select a production/builder to view their active townships.</p>
      </div>

      {/* Builders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builders.length > 0 ? (
          builders.map((builder) => (
            <Link key={builder.id} href={`/schemes/builder/${builder.id}`}>
              <Card className="group border-slate-200 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-100 transition-colors">
                        {builder.logo_url ? (
                          <img src={builder.logo_url} alt={builder.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] px-2 py-0.5">
                        ACTIVE
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                      {builder.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 font-medium min-h-[40px]">
                      {builder.description || 'Professional real estate developer providing high-quality residential and commercial schemes.'}
                    </p>

                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <p className="text-slate-400 font-bold">No builders found in this city yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
