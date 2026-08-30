'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Upload, 
  X, 
  Check, 
  Navigation, 
  Edit2, 
  Image as ImageIcon, 
  Video 
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  defaultValue?: string
  bucket?: string
}

export function ImageUpload({
  onUploadComplete,
  defaultValue = '',
  bucket = 'property-images'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(defaultValue)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = fileName

    try {
      // 1. Read file
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const rawBase64 = reader.result as string
        
        // 2. Compress image using Canvas
        const img = new Image()
        img.src = rawBase64
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Max dimensions to keep size reasonable (e.g. 1600px)
          const MAX_SIZE = 1600
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Export as compressed JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7) // 0.7 quality is sweet spot for ~500kb
          
          const { uploadImageServer } = await import('@/lib/actions/inventory')
          const res = await uploadImageServer(compressedBase64, fileName, bucket)
          
          if (res.error) {
            toast.error(`Upload Failed: ${res.error}`)
            setUploading(false)
          } else if (res.url) {
            setPreview(res.url)
            onUploadComplete(res.url)
            toast.success('Image compressed & uploaded!')
            setUploading(false)
          }
        }
      }
      reader.onerror = () => {
        toast.error('File reading failed')
        setUploading(false)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`)
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreview('')
    onUploadComplete('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        className="relative group cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center transition-all hover:bg-slate-100 hover:border-emerald-300 overflow-hidden">
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs font-bold uppercase">Change Image</p>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Click to upload image</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
                </>
              )}
            </div>
          )}
        </div>

        {preview && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeImage()
            }}
            className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
