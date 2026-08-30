'use client'

import React from 'react'
import { Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logCallStart } from '@/lib/actions/interactions'
import { cn } from '@/lib/utils'

interface CRMCallButtonProps {
  clientId: string
  phone: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  className?: string
  showIcon?: boolean
  label?: string
}

export function CRMCallButton({ 
  clientId, 
  phone, 
  variant = 'outline', 
  className, 
  showIcon = true,
  label 
}: CRMCallButtonProps) {
  const [loading, setLoading] = React.useState(false)

  const handleCall = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await logCallStart(clientId)
    } catch (err) {
      console.error('Failed to log call start:', err)
    } finally {
      setLoading(false)
      window.location.href = `tel:${phone}`
    }
  }

  if (variant === 'link') {
    return (
      <button 
        onClick={handleCall}
        disabled={loading}
        className={cn("font-bold text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50", className)}
      >
        {label || phone}
      </button>
    )
  }

  const Icon = loading ? Loader2 : Phone

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={handleCall}
      disabled={loading}
      className={cn("cursor-pointer font-bold gap-2 min-w-[100px]", className)}
    >
      {showIcon && <Icon className={cn("w-4 h-4", loading && "animate-spin")} />}
      {loading ? 'Connecting...' : (label || 'Call client')}
    </Button>
  )
}
