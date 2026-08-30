'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'

export function CopyLeadFormLink({ agencyName, agentId }: { agencyName: string, agentId: string }) {
  const handleCopy = () => {
    try {
      const slug = encodeURIComponent(agencyName.toLowerCase().replace(/\s+/g, '-'))
      const link = `${window.location.origin}/leadform/${slug}?agent=${agentId}`
      
      navigator.clipboard.writeText(link)
      toast.success("Lead Form Link Copied!", {
        description: "You can share this link on WhatsApp or Social Media."
      })
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleCopy}
      className="rounded-xl h-11 px-4 flex items-center gap-2 font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
    >
      <Link2 className="w-4 h-4" />
      <span className="hidden sm:inline">Copy Form Link</span>
    </Button>
  )
}
