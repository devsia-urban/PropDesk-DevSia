'use client'

import React, { useState, useEffect } from 'react'
import { updateBuilder } from '@/lib/actions/inventory'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, MapPin, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { Suspense } from 'react'

function EditBuilderForm({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { getBuilderById } = await import('@/lib/actions/inventory')
        const data = await getBuilderById(id)
        setInitialData(data)
      } catch (err: any) {
        toast.error('Failed to load data')
      }
    }
    loadData()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const { updateBuilder } = await import('@/lib/actions/inventory')
      await updateBuilder(id, {
        name: formData.get('name') as string,
        city: formData.get('city') as string,
        description: formData.get('description') as string,
        logo_url: formData.get('logo_url') as string,
      })
      toast.success('Builder updated successfully!')
      router.push('/schemes/admin')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!initialData) {
    return <div className="p-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      <p className="text-sm font-bold text-slate-400 animate-pulse">Contacting database...</p>
    </div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link href="/schemes/admin">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-sm transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Builder</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Admin Management</p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Builder Name</Label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={initialData.name}
                  required 
                  className="pl-11 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City / Location</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="city" 
                  name="city" 
                  defaultValue={initialData.city}
                  required 
                  className="pl-11 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="logo_url" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Logo URL (Optional)</Label>
              <Input 
                id="logo_url" 
                name="logo_url" 
                defaultValue={initialData.logo_url}
                className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 transition-all px-5 font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={initialData.description}
                className="min-h-[140px] rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 transition-all p-5 font-medium leading-relaxed"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-600/30 transition-all active:scale-[0.98] group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <EditBuilderForm id={resolvedParams.id} />
    </Suspense>
  )
}
