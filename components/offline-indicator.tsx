'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check initial state
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOffline(true)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setDismissed(false) // Reset dismissal when going offline again
    }
    const handleOnline = () => {
      setIsOffline(false)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top fade-in duration-300">
      <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-3 w-full shadow-md">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <p className="font-bold text-sm leading-tight text-center">
          You are currently offline. Some features may be unavailable.
        </p>
        <button 
          onClick={() => setDismissed(true)}
          className="absolute right-4 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
