'use client'

import React from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logWhatsAppStart } from '@/lib/actions/interactions'
import { cn } from '@/lib/utils'

interface CRMWhatsAppButtonProps {
  clientId: string
  phone: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  className?: string
  showIcon?: boolean
  label?: string
}

export function CRMWhatsAppButton({ 
  clientId, 
  phone, 
  variant = 'outline', 
  className, 
  showIcon = true,
  label 
}: CRMWhatsAppButtonProps) {
  const [loading, setLoading] = React.useState(false)

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await logWhatsAppStart(clientId)
    } catch (err) {
      console.error('Failed to log WhatsApp start:', err)
    } finally {
      setLoading(false)
      const cleanPhone = phone.replace(/\D/g, '').startsWith('91') ? phone.replace(/\D/g, '') : '91' + phone.replace(/\D/g, '')
      // Use window.location.href to ensure redirect works even if popup blocker is on
      window.location.href = `https://wa.me/${cleanPhone}`
    }
  }

  const Icon = loading ? Loader2 : MessageCircle

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={handleWhatsApp}
      disabled={loading}
      className={cn("cursor-pointer font-bold gap-2 min-w-[110px]", className)}
    >
      {showIcon && <Icon className={cn("w-4 h-4", loading && "animate-spin")} />}
      {loading ? 'Opening...' : (label || 'WhatsApp')}
    </Button>
  )
}
