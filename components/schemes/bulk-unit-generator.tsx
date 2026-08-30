'use client'

import React, { useState } from 'react'
import { bulkAddUnits } from '@/lib/actions/inventory'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Layers,
  Maximize2,
  Compass,
  IndianRupee,
  Loader2,
  Settings2,
  Sparkles
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function BulkUnitGenerator({ schemeId }: { schemeId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'single' | 'bulk' | 'paste'>('single')
  const [pasteData, setPasteData] = useState('')
  const [baseRate, setBaseRate] = useState(25000)

  // Bulk Generator State
  const [bulkConfig, setBulkConfig] = useState({
    startNumber: 1,
    count: 10,
    prefix: 'Plot ',
    dimensions: '20x45',
    area: 100,
    facing: 'East',
    rate: 25000,
    unitType: 'plot' as const,
    road_info: '',
    description: ''
  })

  async function handleBulkGenerate() {
    setLoading(true)
    try {
      const units = []
      for (let i = 0; i < bulkConfig.count; i++) {
        units.push({
          unit_number: `${bulkConfig.prefix}${bulkConfig.startNumber + i}`,
          unit_type: bulkConfig.unitType,
          dimensions: bulkConfig.dimensions,
          area_sqyd: bulkConfig.area,
          facing: bulkConfig.facing,
          rate_per_sqyd: bulkConfig.rate,
          status: 'available' as const,
          details: {
            road_info: bulkConfig.road_info || null,
            description: bulkConfig.description || null
          }
        })
      }

      await bulkAddUnits(schemeId, units)
      toast.success(`Successfully generated ${units.length} units!`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasteGenerate() {
    if (!pasteData.trim()) return
    setLoading(true)
    try {
      const lines = pasteData.split('\n').filter(l => l.trim())
      const units = []

      for (const line of lines) {
        // Regex to match: [PlotNumber] [Area] [Everything Else as Road/Facing]
        const match = line.match(/^(\d+)\s+([\d.]+)\s+(.*)$/)
        if (match) {
          const [_, plotNo, area, rawRoadInfo] = match
          
          const facingRegex = /\s*(EAST|WEST|NORTH|SOUTH|NORTH-WEST|NORTH-EAST|SOUTH-WEST|SOUTH-EAST)$/i
          const facingMatch = rawRoadInfo.match(facingRegex)
          
          const facing = facingMatch ? facingMatch[1] : 'East'
          const roadInfo = facingMatch ? rawRoadInfo.replace(facingRegex, '').trim() : rawRoadInfo.trim()

          units.push({
            unit_number: `Plot ${plotNo}`,
            unit_type: 'plot' as const,
            dimensions: '',
            area_sqyd: Number(area),
            facing: facing.toUpperCase(),
            rate_per_sqyd: baseRate,
            status: 'available' as const,
            details: {
              road_info: roadInfo || null,
              description: 'Imported via Smart Paste'
            }
          })
        }
      }

      if (units.length === 0) throw new Error('No valid plot data found. Please check the format.')

      await bulkAddUnits(schemeId, units)
      toast.success(`Successfully imported ${units.length} units!`)
      setPasteData('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex p-1 gap-2 bg-slate-100 rounded-2xl w-fit">
        <Button
          variant={mode === 'single' ? 'secondary' : 'ghost'}
          onClick={() => setMode('single')}
          className="rounded-xl border-2 border-gray-900 cursor-pointer px-4  py-2 font-bold text-sm"
        >
          Add Single
        </Button>
        <Button
          variant={mode === 'bulk' ? 'secondary' : 'ghost'}
          onClick={() => setMode('bulk')}
          className="rounded-xl cursor-pointer border-2 border-emerald-400 px-4 py-2 font-bold text-sm flex gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Bulk Range
        </Button>
        <Button
          variant={mode === 'paste' ? 'secondary' : 'ghost'}
          onClick={() => setMode('paste')}
          className="rounded-xl cursor-pointer border-2 border-blue-400 px-4 py-2 font-bold text-sm flex gap-2"
        >
          <Plus className="w-4 h-4 text-blue-500" />
          Smart Import
        </Button>
      </div>

      <Card className="border-slate-200 shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-8">
          {mode === 'single' ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              setLoading(true)
              bulkAddUnits(schemeId, [{
                unit_number: fd.get('unit_number') as string,
                unit_type: 'plot',
                dimensions: fd.get('dimensions') as string,
                area_sqyd: Number(fd.get('area')),
                facing: fd.get('facing') as string,
                rate_per_sqyd: Number(fd.get('rate')),
                status: 'available',
                details: {
                  road_info: (fd.get('road_info') as string) || null,
                  description: (fd.get('description') as string) || null
                }
              }]).then(() => {
                toast.success('Unit added!')
                router.refresh()
              }).catch(e => toast.error(e.message)).finally(() => setLoading(false))
            }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit/Plot Number</Label>
                <Input name="unit_number" placeholder="e.g. Plot 42" required className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dimensions</Label>
                <Input name="dimensions" placeholder="e.g. 20x45" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Area (SqYard)</Label>
                <Input name="area" type="number" placeholder="100" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facing</Label>
                <Select name="facing" defaultValue="East">
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate per SqYard</Label>
                <Input name="rate" type="number" placeholder="25000" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Road Info (Optional)</Label>
                <Input name="road_info" placeholder="e.g. 40ft Wide Road" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Amenities (Optional)</Label>
                <Input name="description" placeholder="e.g. Corner plot, Park facing" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>
              <div className="md:col-span-2 pt-4">
                <Button disabled={loading} className="w-full h-12 rounded-xl bg-slate-900 shadow-lg shadow-slate-900/10">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Plot'}
                </Button>
              </div>
            </form>
          ) : mode === 'paste' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Base Rate (Apply to all)
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={baseRate} 
                    onChange={e => setBaseRate(Number(e.target.value))} 
                    className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Paste Plot List (Format: Number Area Info)
                </Label>
                <textarea
                  value={pasteData}
                  onChange={e => setPasteData(e.target.value)}
                  placeholder="8 538.2 40 FEET WEST&#10;11 307.62 40 FEET EAST"
                  className="w-full min-h-[300px] p-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Supports copying directly from WhatsApp or Excel.
                </p>
              </div>

              <Button
                onClick={handlePasteGenerate}
                disabled={loading || !pasteData.trim()}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Import {pasteData.split('\n').filter(l => l.trim()).length} Plots
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start from #</Label>
                  <Input
                    type="number"
                    value={bulkConfig.startNumber}
                    onChange={e => setBulkConfig({ ...bulkConfig, startNumber: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">How many plots?</Label>
                  <Input
                    type="number"
                    value={bulkConfig.count}
                    onChange={e => setBulkConfig({ ...bulkConfig, count: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prefix (Optional)</Label>
                  <Input
                    value={bulkConfig.prefix}
                    onChange={e => setBulkConfig({ ...bulkConfig, prefix: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Common Dimensions</Label>
                  <Input
                    value={bulkConfig.dimensions}
                    onChange={e => setBulkConfig({ ...bulkConfig, dimensions: e.target.value })}
                    className="h-12 rounded-xl bg-white border-emerald-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Area (SqYard)</Label>
                  <Input
                    type="number"
                    value={bulkConfig.area}
                    onChange={e => setBulkConfig({ ...bulkConfig, area: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-white border-emerald-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Base Rate</Label>
                  <Input
                    type="number"
                    value={bulkConfig.rate}
                    onChange={e => setBulkConfig({ ...bulkConfig, rate: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-white border-emerald-100"
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Common Road Info (Optional)</Label>
                  <Input
                    value={bulkConfig.road_info}
                    onChange={e => setBulkConfig({ ...bulkConfig, road_info: e.target.value })}
                    placeholder="e.g. 40ft Wide Road"
                    className="h-12 rounded-xl bg-white border-emerald-100"
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Common Description (Optional)</Label>
                  <Input
                    value={bulkConfig.description}
                    onChange={e => setBulkConfig({ ...bulkConfig, description: e.target.value })}
                    placeholder="e.g. Near park, North-East facing"
                    className="h-12 rounded-xl bg-white border-emerald-100"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Summary</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      Will generate {bulkConfig.prefix}{bulkConfig.startNumber} to {bulkConfig.prefix}{bulkConfig.startNumber + bulkConfig.count - 1}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleBulkGenerate}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs px-8 shadow-xl shadow-emerald-600/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  Instant Bulk Generate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
