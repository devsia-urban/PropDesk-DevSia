'use client'

import React, { useState, useEffect } from 'react'
import { createScheme } from '@/lib/actions/inventory'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Layers, MapPin, ArrowLeft, Loader2, Building2, AlertCircle, Plus, Video } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/ui/image-upload'
import { Suspense } from 'react'

function NewSchemeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [builders, setBuilders] = useState<any[]>([])
  const [fetchingBuilders, setFetchingBuilders] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapImageUrl, setMapImageUrl] = useState('')

  const preselectedBuilderId = searchParams.get('builderId')
  const [selectedBuilderId, setSelectedBuilderId] = useState<string | undefined>(preselectedBuilderId || undefined)

  useEffect(() => {
    async function loadData() {
      try {
        const { getBuildersList } = await import('@/lib/actions/inventory')
        const data = await getBuildersList()
        setBuilders(data || [])
      } catch (err: any) {
        console.error('Error fetching builders:', err)
        setError(err.message || 'Failed to load builders')
        toast.error('Could not load builders. Please check database.')
      } finally {
        setFetchingBuilders(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const builderId = formData.get('builderId') as string
      // Builder is now optional, so no strict check needed.

      await createScheme({
        builder_id: builderId === 'none' ? undefined : builderId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        location_details: formData.get('location_details') as string,
        map_image_url: mapImageUrl,
        video_url: formData.get('video_url') as string,
      })
      toast.success('Township created successfully!')
      router.push('/schemes/admin')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Township</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Admin Management</p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Select Builder / Production (Optional)</Label>
              {fetchingBuilders ? (
                <div className="h-14 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center px-5 text-sm text-slate-400 animate-pulse">
                  Contacting database...
                </div>
              ) : (
                <Select name="builderId" defaultValue={preselectedBuilderId || undefined} onValueChange={(val) => setSelectedBuilderId(val || undefined)}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 text-black hover:text-black bg-gray-300 shadow-sm  transition-all focus:ring-emerald-500">
                    <SelectValue placeholder="Choose the builder">
                      {selectedBuilderId === 'none' 
                        ? 'None (Independent Township)' 
                        : builders.find(b => b.id === selectedBuilderId)?.name || "Choose the builder"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 shadow-2xl w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="none" className="py-3 px-4 rounded-xl m-1 transition-colors font-bold text-sm cursor-pointer text-slate-500">
                      None (Independent Township)
                    </SelectItem>
                    {builders.length > 0 ? (
                      builders.map((builder) => (
                        <SelectItem
                          key={builder.id}
                          value={builder.id}
                          label={`${builder.name} (${builder.city})`}
                          className="py-3 px-4  rounded-xl m-1 transition-colors font-bold text-sm cursor-pointer text-black hover:text-black"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 opacity-50 shrink-0" />
                            <span className="flex-1 truncate">{builder.name}</span>
                            <span className="text-[9px] opacity-50 px-2 py-0.5 rounded-md text-gray-800 bg-slate-100 uppercase tracking-tighter">
                              {builder.city}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No builders found</p>
                        <Link href="/schemes/admin/builders/new">
                          <Button size="sm" variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-wider h-8">
                            <Plus className="w-3 h-3 mr-1" /> Add Builder First
                          </Button>
                        </Link>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
              {error && (
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 ml-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Township / Project Name</Label>
              <div className="relative group">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Gokul Vatika Phase 1"
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
                  placeholder="e.g., Near Ring Road, Jaipur"
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
                placeholder="Mention amenities like roads, electricity, parks, etc."
                className="min-h-[140px] rounded-2xl border-slate-200 bg-white shadow-sm focus:border-emerald-400 transition-all p-5 font-medium leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || fetchingBuilders}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/30 transition-all active:scale-[0.98] group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Township <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewSchemePage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <NewSchemeForm />
    </Suspense>
  )
}

import { Badge } from '@/components/ui/badge'
