'use client'

import React, { useState } from "react"
import { Building2, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PropertyImageGalleryProps {
  images: string[]
  coverImage?: string | null
}

export function PropertyImageGallery({ images, coverImage }: PropertyImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const allImages = images.length > 0 ? images : []
  const currentImage = allImages[selectedImage]

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedImage((prev) => (prev + 1) % allImages.length)
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <div className="space-y-4">
      <div
        className="group aspect-3/2 max-h-[70vh] bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200 shadow-sm cursor-pointer"
        onClick={() => currentImage && setIsZoomed(true)}
      >
        <div className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full">
          <Maximize2 className="w-5 h-5 text-white" />
        </div>
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Property featured image"
            fill
            className="object-contain"
            priority
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Building2 className="w-16 h-16 text-slate-200" />
            <p className="text-slate-400 font-medium">No images available</p>
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={cn(
                "w-24 h-20 rounded-xl bg-slate-900 shrink-0 border-2 transition-all flex items-center justify-center relative overflow-hidden shadow-sm",
                selectedImage === idx ? "border-emerald-500 ring-2 ring-emerald-50" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img}
                alt={`Property thumbnail ${idx + 1}`}
                fill
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Overlay */}
      {isZoomed && currentImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[101]"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
            <Image
              src={currentImage}
              alt="Zoomed property image"
              fill
              className="object-contain"
              priority
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 p-3 bg-black/50 hover:bg-black/80 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 p-3 bg-black/50 hover:bg-black/80 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-6 font-bold text-white/70 tracking-widest text-sm">
              {selectedImage + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
