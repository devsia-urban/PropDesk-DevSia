export const dynamic = "force-dynamic";
import React from 'react'
import { SchemesClient } from '@/components/schemes/schemes-client'
import { requireProfile } from '@/lib/auth/get-session'

export default async function SchemesPage() {
  const profile = await requireProfile()
  const isAdmin = profile.role === 'admin'
  
  return <SchemesClient isAdmin={isAdmin} />
}
