'use client'

import React, { useState } from 'react'
import { getActiveCities } from '@/lib/actions/inventory'
import Link from 'next/link'
import { MapPin, ArrowRight, Building2, Search, Settings2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'

export function SchemesClient({ isAdmin }: { isAdmin: boolean }) {
  const { data: cities, isLoading, error, mutate } = useSWR('active-cities', getActiveCities)

  const [searchTerm, setSearchTerm] = useState('')

  const filteredCities = cities?.filter(city => city.toLowerCase().includes(searchTerm.toLowerCase())) || []

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">Real Estate Schemes</h1>
          <p className="text-slate-500 max-sm:text-sm font-medium mt-1">Discover townships and plots across different cities.</p>
        </div>
        <div className="flex items-center max-sm:flex-col max-sm:items-start gap-3">
          {isAdmin && (
            <Link href="/schemes/admin">
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2 h-11 px-5 bg-white shadow-sm">
                <Settings2 className="w-4 h-4 text-emerald-500" />
                Manage Inventory
              </Button>
            </Link>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search city or builder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* City Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-[2rem] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-red-50 rounded-[2rem] border border-red-100 border-dashed">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
              <X className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              Connection Error
            </h2>
            <p className="text-slate-500 text-center max-w-sm mb-8 font-medium">
              Could not fetch cities. This usually happens if the server is busy.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-black text-sm hover:border-slate-200 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : isLoading && filteredCities.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-4">
              <Skeleton className="w-14 h-14 rounded-2xl mb-6" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))
        ) : filteredCities.length > 0 ? (
          filteredCities.map((city) => (
            <Link key={city} href={`/schemes/city/${city.toLowerCase()}`}>
              <Card className="group border-slate-200 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer bg-white relative">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-emerald-500 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                </div>
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-emerald-50 transition-colors">
                    <MapPin className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 capitalize">{city}</h3>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Explore builders & townships</p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No active schemes yet</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">Admins can start by adding builders and townships to cities.</p>
            {isAdmin ? (
              <Link href="/schemes/admin">
                <Button className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 px-8 h-12 font-black uppercase tracking-widest text-xs">
                  Go to Admin Panel
                </Button>
              </Link>
            ) : (
              <Button className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 px-6">
                Contact Admin
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
