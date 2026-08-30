'use client'

import React, { useState, useEffect } from "react"
import { formatRelativeTime } from "@/lib/utils/format"

interface RelativeTimeProps {
  date: string | Date | null | undefined
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!date) return null

  const dateString = typeof date === 'string' ? date : date.toISOString()

  // During Server-Side Rendering (SSR), we render a stable, 
  // non-relative date to avoid hydration mismatches.
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {new Date(dateString).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short'
        })}
      </span>
    )
  }

  // Once mounted on the client, we show the dynamic relative time.
  return (
    <span className={className}>
      {formatRelativeTime(dateString)}
    </span>
  )
}
