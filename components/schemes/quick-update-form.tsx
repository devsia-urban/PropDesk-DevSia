'use client'

import React, { useState } from 'react'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Edit2, Loader2, Video, Image as ImageIcon } from 'lucide-react'
import { updateScheme } from '@/lib/actions/inventory'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QuickUpdateFormProps {
  schemeId: string
  initialMapUrl: string
  initialVideoUrl?: string
}

export function QuickUpdateForm({ schemeId, initialMapUrl, initialVideoUrl }: QuickUpdateFormProps) {
  const [mapUrl, setMapUrl] = useState(initialMapUrl)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await updateScheme(schemeId, { 
        map_image_url: mapUrl,
        video_url: videoUrl 
      })
      toast.success('Visuals updated successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-50 border-2 border-slate-200/50 rounded-[2.5rem] p-8 sm:p-10 space-y-8">
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-emerald-500" />
          Admin Visual Management
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload or change the project imgs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Upload Plot Img</Label>
            <ImageUpload
              defaultValue={mapUrl}
              onUploadComplete={(url) => setMapUrl(url)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Video URL (YouTube/Vimeo)</Label>
            <div className="relative group">
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Img URL (Manual)</Label>
            <div className="relative group">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
            </div>
          </div>

          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Visual Changes'}
          </Button>

          <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic text-center">
            Tip: Changes made here reflect across all units in this project.
          </p>
        </div>
      </div>
    </div>
  )
}
