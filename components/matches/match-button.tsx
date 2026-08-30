'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface SingleMatchButtonProps {
  clientId?: string
  propertyId?: string
  label?: string
}

export function SingleMatchButton({ clientId, propertyId, label = "Find Matches" }: SingleMatchButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const router = useRouter()

  const runMatch = async () => {
    setIsRunning(true)
    try {
      const res = await fetch("/api/matches/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, propertyId }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Match engine run! Found ${data.totalMatches} matches`)
        // If we found matches, maybe navigate to the matches tab
        router.refresh()
      } else {
        toast.error(data.error || "Failed to find matches")
      }
    } catch {
      toast.error("Match engine failed")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button
      onClick={runMatch}
      disabled={isRunning}
      className="bg-emerald-500 cursor-pointer hover:bg-emerald-600 text-white shadow-sm font-bold gap-2"
    >
      {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white shrink-0" />}
      {isRunning ? "Matching..." : label}
    </Button>
  )
}
