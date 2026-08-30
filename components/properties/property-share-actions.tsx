"use client"

import React from "react"
import { Share2, Copy, Check, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { logPropertyShared } from "@/lib/actions/activities"
import { generateWhatsAppMessage } from "@/lib/utils/format"
import { useAuth } from "@/lib/context/auth-context"

interface PropertyShareActionsProps {
  propertyId: string
  propertyTitle: string
  propertySlug?: string
  agencyName?: string
  clientName?: string
  propertyType?: string
  locality?: string
  price?: number
  variant?: "default" | "outline" | "ghost"
  className?: string
  showLabel?: boolean
  whatsappTemplate?: string | null
}

export function PropertyShareActions({
  propertyId,
  propertyTitle,
  propertySlug,
  agencyName = "DevSia Dealer",
  clientName = "Client",
  propertyType = "Property",
  locality = "this location",
  price = 0,
  variant = "outline",
  className,
  showLabel = true,
  whatsappTemplate
}: PropertyShareActionsProps) {
  const { isReadOnly } = useAuth()
  const [copied, setCopied] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/p/${propertySlug || propertyId}`
    : ""

  const handleCopy = async () => {
    if (isReadOnly) {
      toast.error("Read-Only Mode", { description: "Subscription paused. Renew to share links." })
      return
    }
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success("Link Copied!", {
        description: "Public property link is now in your clipboard.",
      })

      // Log lead activity asynchronously
      logPropertyShared(propertyId, propertyTitle).catch(console.error)

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleWhatsAppShare = () => {
    if (isReadOnly) {
      toast.error("Read-Only Mode", { description: "Subscription paused. Renew to share via WhatsApp." })
      return
    }
    const message = generateWhatsAppMessage({
      agencyName,
      clientName,
      propertyTitle,
      propertyType,
      locality,
      score: 95, // Aesthetic default for sharing
      price,
      link: publicUrl,
      template: whatsappTemplate
    })
    window.open(`https://wa.me/?text=${message}`, "_blank")

    // Log lead activity
    logPropertyShared(propertyId, propertyTitle).catch(console.error)
  }

  if (!mounted) {
    return (
      <Button
        variant={variant}
        className={cn("gap-2 border-slate-200 text-slate-600 font-bold", className)}
        disabled
      >
        <Share2 className="w-4 h-4" />
        {showLabel && "Share"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button
          variant={variant}
          disabled={isReadOnly}
          className={cn("gap-2 border-slate-200 cursor-pointer text-slate-600 font-bold", className, isReadOnly && "opacity-50 cursor-not-allowed")}
        >
          <Share2 className="w-4 h-4" />
          {showLabel && "Share"}
        </Button>
      } />

      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
        <DropdownMenuItem
          onClick={handleCopy}
          className="rounded-xl h-11 cursor-pointer gap-3 focus:bg-slate-500 font-bold text-slate-700"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Public Link"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleWhatsAppShare}
          className="rounded-xl h-11 cursor-pointer gap-3 focus:bg-emerald-400 focus:text-emerald-50 font-bold text-emerald-600"
        >
          <MessageSquare className="w-4 h-4" />
          Share via WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
