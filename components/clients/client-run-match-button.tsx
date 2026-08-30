'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ClientRunMatchButton({ clientId }: { clientId: string }) {
  const [isRunning, setIsRunning] = useState(false)
  const router = useRouter()

  const handleRun = async () => {
    setIsRunning(true)
    try {
      const res = await fetch('/api/matches/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (data.success) {
        const count = data.totalMatches ?? 0
        if (count > 0) {
          toast.success(`Found ${count} match${count !== 1 ? 'es' : ''} for this client`)
        } else {
          toast.info("No matches found. Try adjusting the client requirements.")
        }
        router.refresh()
      } else {
        toast.error(data.error || 'Match engine failed')
      }
    } catch {
      toast.error('Failed to run match engine')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className="w-full flex items-center gap-3 h-11 px-4 text-amber-600 cursor-pointer font-bold text-sm rounded-xl hover:bg-amber-50 transition-colors disabled:opacity-50"
    >
      {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {isRunning ? 'Running engine…' : 'Run match engine'}
    </button>
  )
}
