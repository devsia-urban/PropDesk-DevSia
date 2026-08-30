'use client'

import React, { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deleteClient } from "@/lib/actions/clients"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

export function BulkDeleteButton({ 
  selectedIds, 
  onClearSelection 
}: { 
  selectedIds: string[], 
  onClearSelection: () => void 
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const bulkDelete = async () => {
    setIsDeleting(true)
    let successCount = 0
    // Perform sequential deletions to avoid hammering the DB or running into race conditions
    for (const id of selectedIds) {
      const { error } = await deleteClient(id)
      if (!error) successCount++
    }
    setIsDeleting(false)
    if (successCount > 0) {
      toast.success(`${successCount} clients deleted`)
      onClearSelection()
      router.refresh()
    } else {
      toast.error("Failed to delete clients")
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="sticky top-0 z-20 bg-white border border-slate-100 shadow-lg rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 ml-2">
        <span className="text-sm font-bold text-slate-900">{selectedIds.length} clients selected</span>
        <Separator orientation="vertical" className="h-4 bg-slate-200" />
        <button
          onClick={onClearSelection}
          className="text-sm text-emerald-600 font-bold hover:text-emerald-700"
        >
          Clear selection
        </button>
      </div>
      <Button
        variant="ghost"
        className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
        onClick={bulkDelete}
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isDeleting ? "Deleting..." : "Delete selected"}
      </Button>
    </div>
  )
}
