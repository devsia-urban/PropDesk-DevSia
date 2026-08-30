'use client'

import { ReactNode } from 'react'
import { useRole } from '@/lib/context/auth-context'

interface RoleGateProps {
  role: 'admin' | 'agent'
  fallback?: ReactNode
  children: ReactNode
}

/**
 * RoleGate renders children only if the user has the required role.
 * Fallback is rendered otherwise.
 * Logic: 'admin' role satisfies both 'admin' and 'agent' requirements in common scenarios,
 * but here we follow strict matching or simple hierarchy if needed.
 */
export function RoleGate({ role, fallback = null, children }: RoleGateProps) {
  const { isAdmin, isAgent } = useRole()

  const hasAccess = role === 'admin' ? isAdmin : (isAdmin || isAgent)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
