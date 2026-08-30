export const dynamic = "force-dynamic";
import React from "react"
import { requireSuperAdmin } from "@/lib/auth/get-session"
import { SuperAdminClient } from "@/components/admin/superadmin-client"

export default async function SuperAdminPage() {
  await requireSuperAdmin()
  return <SuperAdminClient />
}
