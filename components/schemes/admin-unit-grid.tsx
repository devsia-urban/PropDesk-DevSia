'use client'

import React, { useState, useMemo } from 'react'
import { Unit } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUnitStatus, deleteUnit, updateUnit } from '@/lib/actions/inventory'
import { toast } from 'sonner'
import {
  Trash2,
  Edit2,
  Maximize2,
  Compass,
  IndianRupee,
  Loader2,
  Check,
  User,
  Clock,
  Phone,
  CreditCard,
  Building2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminUnitGrid({ initialUnits }: { initialUnits: any[] }) {
  const [units, setUnits] = useState(initialUnits)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'hold' | 'booked' | 'sold'>('all')
  const [editingUnit, setEditingUnit] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filteredUnits = useMemo(() => {
    if (filter === 'all') return units
    return units.filter(u => u.status === filter)
  }, [units, filter])

  async function handleStatusChange(unitId: string, newStatus: 'available' | 'hold' | 'booked' | 'sold') {
    setUpdatingId(unitId)
    try {
      await updateUnitStatus(unitId, newStatus)
      setUnits(units.map(u => u.id === unitId ? { ...u, status: newStatus } : u))
      toast.success(`Unit status updated to ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(unitId: string) {
    if (!confirm('Are you sure you want to delete this unit? This cannot be undone.')) return
    setIsDeleting(unitId)
    try {
      await deleteUnit(unitId)
      setUnits(units.filter(u => u.id !== unitId))
      toast.success('Unit deleted successfully')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUnit) return
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    setUpdatingId(editingUnit.id)

    try {
      const updates = {
        unit_number: fd.get('unit_number') as string,
        dimensions: fd.get('dimensions') as string,
        area_sqyd: Number(fd.get('area_sqyd')),
        facing: fd.get('facing') as string,
        rate_per_sqyd: Number(fd.get('rate_per_sqyd')),
        details: {
          ...(editingUnit.details || {}),
          road_info: fd.get('road_info') as string,
          broker: fd.get('broker') as string,
          description: fd.get('description') as string,
        }
      }
      const updatedData = await updateUnit(editingUnit.id, updates)
      setUnits(units.map(u => u.id === editingUnit.id ? { ...u, ...updates } : u))
      toast.success('Unit updated successfully')
      setEditingUnit(null)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const FilterButton = ({ value, label }: { value: string, label: string }) => (
    <Button
      variant={filter === value ? 'default' : 'secondary'}
      onClick={() => setFilter(value as any)}
      className={`rounded-xl h-9 text-xs font-bold px-4 ${filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {label}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
        <FilterButton value="all" label="All Units" />
        <FilterButton value="available" label="Available" />
        <FilterButton value="hold" label="On Hold" />
        <FilterButton value="booked" label="Booked" />
        <FilterButton value="sold" label="Sold" />
      </div>

      {filteredUnits.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold text-sm">No units found matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className={`border-slate-200 rounded-[2rem] overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 ${unit.status === 'hold' || unit.status === 'booked' ? 'border-l-4 ' + (unit.status === 'hold' ? 'border-l-amber-400' : 'border-l-blue-400') : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 text-lg shadow-inner">
                      {unit.unit_number.replace('Plot ', '')}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 leading-none">{unit.unit_number}</p>
                      <div className="mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger disabled={updatingId === unit.id} className="focus:outline-none focus:ring-2 ring-emerald-500 ring-offset-2 rounded-md">
                            <Badge className={`cursor-pointer border-none text-[9px] font-black py-1 px-2 uppercase tracking-widest transition-colors ${unit.status === 'available' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                unit.status === 'hold' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                  unit.status === 'booked' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                    'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              }`}>
                              {updatingId === unit.id ? <Loader2 className="w-3 h-3 animate-spin mr-1.5 inline" /> : null}
                              {unit.status}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="rounded-2xl border-slate-200 p-2 shadow-xl">
                            <div className="px-2 py-1.5 mb-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">Override Status</div>
                            {(['available', 'hold', 'booked', 'sold'] as const).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(unit.id, status)}
                                className={`text-xs font-bold py-2.5 px-3 cursor-pointer rounded-xl flex items-center justify-between mb-1 last:mb-0 ${unit.status === status ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                              >
                                <span className="uppercase">{status}</span>
                                {unit.status === status && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingUnit(unit)}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unit.id)}
                      disabled={isDeleting === unit.id}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      {isDeleting === unit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Booking Info if Active */}
                {unit.active_booking && (
                  <Popover>
                    <PopoverTrigger className="text-left w-full">
                      <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          {unit.active_booking.agent_avatar_url ? (
                            <img src={unit.active_booking.agent_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-black text-slate-900 truncate">{unit.active_booking.customer_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Via {unit.active_booking.agent_name}</p>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 rounded-2xl p-4 shadow-xl border-slate-100" align="start">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Customer Details</p>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" /> {unit.active_booking.customer_name}
                            </p>
                            {unit.active_booking.customer_phone && (
                              <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                                <Phone className="w-4 h-4 text-slate-400" /> {unit.active_booking.customer_phone}
                              </p>
                            )}
                            {unit.active_booking.customer_aadhaar && (
                              <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                                <CreditCard className="w-4 h-4 text-slate-400" /> {unit.active_booking.customer_aadhaar}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Agent Details</p>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" /> {unit.active_booking.agent_name}
                            </p>
                            {unit.active_booking.agent_phone && (
                              <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                                <Phone className="w-4 h-4 text-slate-400" /> {unit.active_booking.agent_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {unit.status === 'hold' && (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black">24h</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100/50">
                    <div className="flex justify-center mb-1"><Maximize2 className="w-4 h-4 text-slate-300" /></div>
                    <p className="text-xs font-black text-slate-900">{unit.area_sqyd} <span className="text-[9px] text-slate-400 font-bold uppercase">yd</span></p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100/50">
                    <div className="flex justify-center mb-1"><Compass className="w-4 h-4 text-slate-300" /></div>
                    <p className="text-xs font-black text-slate-900">{unit.facing || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100/50">
                    <div className="flex justify-center mb-1"><IndianRupee className="w-4 h-4 text-slate-300" /></div>
                    <p className="text-xs font-black text-slate-900">{(unit.rate_per_sqyd || 0) / 1000}<span className="text-[9px] text-slate-400 font-bold uppercase">k</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Edit Unit {editingUnit?.unit_number}</DialogTitle>
          </DialogHeader>
          {editingUnit && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Unit Number</Label>
                <Input name="unit_number" defaultValue={editingUnit.unit_number} required className="h-10 rounded-xl bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Dimensions</Label>
                  <Input name="dimensions" defaultValue={editingUnit.dimensions} placeholder="e.g. 20x45" className="h-10 rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Facing</Label>
                  <Input name="facing" defaultValue={editingUnit.facing} placeholder="e.g. East" className="h-10 rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Area (SqYd)</Label>
                  <Input name="area_sqyd" type="number" defaultValue={editingUnit.area_sqyd} required className="h-10 rounded-xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Rate per SqYd</Label>
                  <Input name="rate_per_sqyd" type="number" defaultValue={editingUnit.rate_per_sqyd} required className="h-10 rounded-xl bg-slate-50" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Additional Details (Public)</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Road Info</Label>
                    <Input name="road_info" defaultValue={editingUnit.details?.road_info || ''} placeholder="e.g. 40ft Main Road" className="h-10 rounded-xl bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Description / Advantages</Label>
                    <textarea
                      name="description"
                      defaultValue={editingUnit.details?.description || ''}
                      placeholder="e.g. Corner plot near the park..."
                      className="w-full h-24 rounded-xl bg-slate-50 border-slate-200 text-sm p-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={updatingId === editingUnit.id} className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20">
                  {updatingId === editingUnit.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
