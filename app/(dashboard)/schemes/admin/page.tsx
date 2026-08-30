import React, { Suspense } from 'react'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Layers,
  MapPin,
  MoreVertical,
  PlusCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TownshipsSkeleton, StatsSkeleton } from '@/components/ui/skeleton-loaders'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

async function InventoryContent() {
  const supabase = await createClient()

  const { data: schemes } = await supabase
    .from('schemes')
    .select('*, builder:builders(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <Layers className="w-5 h-5" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">TOTAL INVENTORY</Badge>
            </div>
            <p className="text-3xl font-black text-slate-900">{schemes?.length || 0}</p>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Active Townships</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          Active Townships
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {schemes && schemes.length > 0 ? (
            schemes.map((scheme) => (
              <Card key={scheme.id} className="border-slate-200 bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {scheme.map_image_url ? (
                          <img src={scheme.map_image_url} alt={scheme.name} className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{scheme.name}</h3>
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-500 border-emerald-200 bg-emerald-50 shrink-0">
                            {scheme.total_units || 0} Units
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 truncate">
                          {scheme.builder && (
                            <>
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="truncate">{scheme.builder.name}</span>
                              <span className="opacity-50">•</span>
                            </>
                          )}
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{scheme.location_details || 'No location'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <Link href={`/schemes/admin/schemes/${scheme.id}/inventory`} className="flex-1 sm:flex-initial">
                        <Button size="sm" className="w-full sm:w-auto rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-9 text-xs font-bold px-5">
                          Manage Inventory
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center rounded-xl h-9 w-9 border border-slate-200 hover:bg-slate-50 transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">
                          <Link href={`/schemes/admin/schemes/${scheme.id}/edit`}>
                            <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer">
                              Edit Township
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="text-xs font-bold py-2.5 text-rose-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-lg mb-1">No townships added yet.</p>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">Start by creating your first township project to manage your plot inventory.</p>
              <Link href="/schemes/admin/schemes/new">
                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 px-6 h-11">
                  <PlusCircle className="w-4 h-4 mr-2" /> Create First Township
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default async function InventoryAdminPage() {
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    redirect('/schemes')
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your active townships and plot inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/schemes/admin/schemes/new">
            <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 h-11 px-6 shadow-lg shadow-slate-900/10 gap-2">
              <PlusCircle className="w-4 h-4" />
              New Township
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={
        <>
          <StatsSkeleton />
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-slate-200 animate-pulse" />
              Loading Townships...
            </h2>
            <TownshipsSkeleton />
          </div>
        </>
      }>
        <InventoryContent />
      </Suspense>
    </div>
  )
}
