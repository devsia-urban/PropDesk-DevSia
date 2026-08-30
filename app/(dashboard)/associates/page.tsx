export const dynamic = "force-dynamic";
import React from 'react'
import { getProfile } from '@/lib/auth/get-session'
import { AssociatesClient } from '@/components/associates/associates-client'

export default async function AssociatesPage() {
  const profile = await getProfile()
  
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 font-medium max-w-md">
          Only Agency Admins can review and manage incoming associate applications.
        </p>
      </div>
    )
  }

  return <AssociatesClient agencyId={profile.agency_id!} />
}
