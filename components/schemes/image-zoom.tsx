'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Maximize2, X, Download } from 'lucide-react'

interface ImageZoomProps {
  src: string
  alt: string
  title: string
}

export function ImageZoom({ src, alt, title }: ImageZoomProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/\s+/g, '_')}_layout.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: Open in new tab
      window.open(src, '_blank')
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="w-full text-left rounded-3xl overflow-hidden border border-slate-200 shadow-sm group relative bg-white cursor-pointer active:scale-[0.99] transition-all duration-300"
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <Maximize2 className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </button>
        }
      />
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 border-none bg-black/95 backdrop-blur-xl overflow-hidden shadow-2xl flex items-center justify-center rounded-[2rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Image View</DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-full flex items-center justify-center group">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
          />

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="absolute bottom-6 right-6 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-gray-900/10 text-black transition-all active:scale-95 shadow-2xl"
            title="Download Image"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
