export const dynamic = "force-dynamic";
import React from 'react'
import { getUnitsByScheme } from '@/lib/actions/inventory'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Layers, MoreVertical, Trash2, Edit2, Maximize2, Compass, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import BulkUnitGenerator from '@/components/schemes/bulk-unit-generator'
import AdminUnitGrid from '@/components/schemes/admin-unit-grid'

export default async function SchemeInventoryManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/schemes')

  const { id } = await params
  const supabase = await createClient()
  const { data: scheme } = await supabase
    .from('schemes')
    .select('*, builder:builders(name)')
    .eq('id', id)
    .single()

  if (!scheme) return <div>Scheme not found</div>

  const units = await getUnitsByScheme(id)

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/schemes/admin">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{scheme.name}</h1>
              <Badge variant="secondary" className="text-[10px] font-black uppercase bg-slate-100">{(scheme.builder as any)?.name}</Badge>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">Manage plots and availability for this township.</p>
          </div>
        </div>
      </div>

      {/* Generator Tool */}
      <BulkUnitGenerator schemeId={id} />

      {/* Current Inventory */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            Current Inventory ({units.length})
          </h2>
        </div>

        <AdminUnitGrid initialUnits={units} />
      </div>
    </div>
  )
}
