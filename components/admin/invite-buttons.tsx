'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, MessageCircle, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { inviteAgencyOwner } from '@/lib/actions/admin'

interface InviteButtonsProps {
  agencyId: string
  agencyName: string
  contactEmail: string
}

export function InviteButtons({ agencyId, agencyName, contactEmail }: InviteButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const getManualUrl = () => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/accept-invite#email=${encodeURIComponent(contactEmail)}&invite=${agencyId}`
  }

  const handleInvite = async () => {
    setIsInviting(true)
    try {
      await inviteAgencyOwner(contactEmail, agencyId)
      toast.success(`Invite sent successfully to ${contactEmail}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const copyLink = async () => {
    const url = getManualUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Manual setup link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const shareWhatsApp = () => {
    const url = getManualUrl()
    const text = `Greetings! 🏠\n\nI've set up your DevSia account for *${agencyName}*.\n\nComplete your setup here: ${url}\n\nPlease check your email for the official login link too!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl w-fit">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInvite}
        disabled={isInviting}
        className="h-8 gap-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm bg-white"
      >
        {isInviting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Mail className="w-3.5 h-3.5" />
        )}
        Send Secure Invite
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={copyLink}
        className={cn(
          "h-8 gap-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
          copied ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:bg-slate-200"
        )}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        Manual Link
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={shareWhatsApp}
        className="h-8 gap-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-[#25D366]/10 hover:text-[#075E54] transition-all"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WA
      </Button>
    </div>
  )
}
