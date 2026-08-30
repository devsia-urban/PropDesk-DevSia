export const dynamic = "force-dynamic";
import React from "react"
import { requireProfile } from "@/lib/auth/get-session"
import { getAgency } from "@/lib/actions/settings"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const [profile, agency] = await Promise.all([
    requireProfile(),
    getAgency(),
  ])

  return <SettingsClient initialProfile={profile} initialAgency={agency} />
}
