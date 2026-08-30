export const dynamic = "force-dynamic";
import React from "react"
import { Plus } from "lucide-react"
import { getSaasLeads } from "@/lib/actions/saas-leads"
import { SaasLeadsTable } from "@/components/admin/saas-leads-table"
import { CreateSaasLeadDialog } from "@/components/admin/create-saas-lead-dialog"
import { requireSuperAdmin } from "@/lib/auth/get-session"

export default async function SuperAdminLeadsPage() {
  await requireSuperAdmin()
  const leads = await getSaasLeads()

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SaaS Sales CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Track prospective agencies and log follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <CreateSaasLeadDialog />
        </div>
      </div>

      <SaasLeadsTable leads={leads} />
    </div>
  )
}
