'use client'

import React, { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RotateCw, ZoomIn } from "lucide-react"
import { toast } from "sonner"

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (base64: string) => void
  onCancel: () => void
}

// Convert data URL or URL to Image object
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

// Draw the cropped image to canvas and extract as Blob with compression
async function compressAndCropImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('No 2d context')

  // Set the canvas size to the cropped size to avoid scaling up,
  // but cap max dimensions to keep size small (~200kb limit)
  const MAX_WIDTH = 1200
  let scale = 1
  if (pixelCrop.width > MAX_WIDTH) {
    scale = MAX_WIDTH / pixelCrop.width
  }

  canvas.width = pixelCrop.width * scale
  canvas.height = pixelCrop.height * scale

  ctx.save()
  
  // Apply rotation and draw
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        
        // Convert to base64 for preview/storage consistency in this prototype
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      0.6 // Slightly lower quality to ensure < 1MB
    )
  })
}

export function ImageCropperDialog({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChangeComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const base64 = await compressAndCropImage(imageSrc, croppedAreaPixels, rotation)
      onCropComplete(base64)
    } catch (e) {
      toast.error("Failed to crop image")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-4 px-6 border-b border-slate-100">
          <DialogTitle className="text-slate-900">Adjust Image (3:2)</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[60vh] bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 2}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropChangeComplete}
          />
        </div>

        <div className="p-6 bg-white space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                <ZoomIn className="w-4 h-4" /> Zoom
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                <RotateCw className="w-4 h-4" /> Rotation
              </div>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e) => setRotation(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50">
          <Button variant="ghost" className="text-slate-600 hover:bg-slate-200" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white" 
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Crop & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
