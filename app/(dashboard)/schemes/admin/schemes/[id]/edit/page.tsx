'use client'

import React, { useState, useEffect } from 'react'
import { updateScheme, getBuildersByCity } from '@/lib/actions/inventory'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Layers, MapPin, ArrowLeft, Loader2, Save, AlertCircle, Building2, Video } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'

import { Suspense } from 'react'

function EditSchemeForm({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<any>(null)
  const [builders, setBuilders] = useState<any[]>([])
  const [fetchingBuilders, setFetchingBuilders] = useState(true)
  const [mapImageUrl, setMapImageUrl] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const { getSchemeById, getBuildersList } = await import('@/lib/actions/inventory')
        const [schemeData, buildersData] = await Promise.all([
          getSchemeById(id),
          getBuildersList()
        ])
        setInitialData(schemeData)
        setMapImageUrl(schemeData?.map_image_url || '')
        setBuilders(buildersData || [])
      } catch (err: any) {
        toast.error('Failed to load data')
      } finally {
        setFetchingBuilders(false)
      }
    }
    loadData()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { updateScheme } = await import('@/lib/actions/inventory')
      const builderId = formData.get('builderId') as string

      await updateScheme(id, {
        builder_id: builderId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        location_details: formData.get('location_details') as string,
        map_image_url: mapImageUrl,
        video_url: formData.get('video_url') as string,
      })
      toast.success('Township updated successfully!')
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Township</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Admin Management</p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Builder / Production</Label>
              {fetchingBuilders ? (
                <div className="h-14 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center px-5 text-sm text-slate-400 animate-pulse">
                  Contacting database...
                </div>
              ) : (
                <Select name="builderId" defaultValue={initialData.builder_id}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm hover:border-emerald-200 transition-all focus:ring-emerald-500">
                    <SelectValue placeholder="Choose builder" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                    {builders.map((builder) => (
                      <SelectItem
                        key={builder.id}
                        value={builder.id}
                        label={`${builder.name} (${builder.city})`}
                        className="py-3 px-4 focus:bg-emerald-50 focus:text-emerald-700 rounded-xl m-1 transition-colors font-bold text-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 opacity-50 shrink-0" />
                          <span className="flex-1 truncate">{builder.name}</span>
                          <span className="text-[9px] opacity-50 px-2 py-0.5 rounded-md bg-slate-100 uppercase tracking-tighter">
                            {builder.city}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Township Name</Label>
              <div className="relative group">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
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
              <Label htmlFor="location_details" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Location Details</Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="location_details"
                  name="location_details"
                  defaultValue={initialData.location_details}
                  required
                  className="pl-11 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Project Visuals (Imgs & Video)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Plot Img</span>
                  <ImageUpload 
                    onUploadComplete={(url) => setMapImageUrl(url)}
                    defaultValue={mapImageUrl}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Img URL</span>
                    <Input
                      value={mapImageUrl}
                      onChange={(e) => setMapImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-12 rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-500">Video Walkthrough URL</span>
                    <div className="relative group">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        name="video_url"
                        defaultValue={initialData.video_url}
                        placeholder="e.g. YouTube Link"
                        className="pl-9 h-12 rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Project Highlights</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={initialData.description}
                className="min-h-[140px] rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 transition-all p-5 font-medium leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || fetchingBuilders}
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

export default function EditSchemePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <EditSchemeForm id={resolvedParams.id} />
    </Suspense>
  )
}
