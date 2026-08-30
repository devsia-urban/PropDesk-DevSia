'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface LogoutButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  children?: React.ReactNode
}

export function LogoutButton({ className, variant = 'ghost', children }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      // POST to server-side route which clears the SSR session cookie properly
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <Button 
      variant={variant} 
      className={cn('w-full justify-start gap-3', className)} 
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {!children && <span>Logging out...</span>}
        </>
      ) : (
        children || (
          <>
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </>
        )
      )}
    </Button>
  )
}
