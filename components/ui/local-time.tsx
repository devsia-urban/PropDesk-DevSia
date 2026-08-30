'use client'

import React, { useEffect, useState } from 'react'

interface LocalTimeProps {
  date: string
  format?: 'full' | 'time' | 'date'
  className?: string
}

export function LocalTime({ date, format = 'full', className }: LocalTimeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Show a skeleton or nothing during SSR to avoid hydration mismatch
    return <span className={className}>...</span>
  }

  const d = new Date(date)
  
  if (format === 'time') {
    return (
      <span className={className}>
        {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
      </span>
    )
  }

  if (format === 'date') {
    return (
      <span className={className}>
        {d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    )
  }

  return (
    <span className={className}>
      {d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
      {" @ "}
      {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  )
}
