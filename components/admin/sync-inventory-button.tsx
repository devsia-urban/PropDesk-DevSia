'use client'

import React, { useState, useTransition } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { syncInventoryStatus } from '@/lib/actions/inventory'

export function SyncInventoryButton() {
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    startTransition(async () => {
      try {
        const res = await syncInventoryStatus()
        if (res.success) {
          toast.success(`Inventory synced! Fixed ${res.fixedCount} units.`)
        } else {
          toast.error(res.message || 'Sync failed')
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred during sync')
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleSync}
      className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs h-11 px-4 gap-2 hover:bg-slate-50 transition-all"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      Sync Inventory
    </Button>
  )
}
