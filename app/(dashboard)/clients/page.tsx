export const dynamic = "force-dynamic";
import React, { Suspense } from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { ClientList } from "@/components/clients/client-list"
import { getClients, getTeamMembers } from "@/lib/actions/clients"
import { getProfile } from "@/lib/auth/get-session"
import { createClient } from "@/lib/supabase/server"
import { CopyLeadFormLink } from "@/components/clients/copy-lead-form-link"

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    budget_min?: string
    budget_max?: string
    property_types?: string
    status?: string
    page?: string
    assigned_to?: string
    looking_for?: string
  }>
}

export default async function ClientsPage(props: ClientsPageProps) {
  const profile = await getProfile()
  const isReadOnly = profile?.subscription_status === 'paused' && !profile?.is_super_admin

  let agencyName = ''
  if (profile?.agency_id) {
    const supabase = await createClient()
    const { data: agency } = await supabase.from('agencies').select('name').eq('id', profile.agency_id).single()
    if (agency) agencyName = agency.name
  }

  // Default empty filters for server-side prefetch
  const filtersKey = {
    search: '',
    status: 'any',
    budget_min: undefined,
    budget_max: undefined,
    property_types: [],
    assigned_to: 'any',
    looking_for: 'any',
    page: 1,
  }
  const initialData = await getClients(filtersKey)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500 font-medium">Your buyer and renter database</p>
        </div>
        {!isReadOnly && (profile?.role === 'admin' || profile?.role === 'agent') && (
          <div className="flex items-center gap-3">
            {agencyName && profile?.id && (
              <CopyLeadFormLink agencyName={agencyName} agentId={profile.id} />
            )}
            <Link
              href="/clients/new"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl h-10 px-5 flex items-center gap-2 font-bold"
              )}
            >
              <Plus className="w-4 h-4" />
              Add client
            </Link>
          </div>
        )}
      </div>

      <Suspense fallback={<div className="h-40 bg-white animate-pulse rounded-2xl border border-slate-100" />}>
        <ClientList 
          initialData={initialData}
          currentRole={profile?.role || 'agent'} 
          currentUserId={profile?.id}
          teamMembers={await getTeamMembers()} 
        />
      </Suspense>
    </div>
  )
}
