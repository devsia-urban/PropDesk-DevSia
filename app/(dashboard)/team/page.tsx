export const dynamic = "force-dynamic";
import React from "react"
import { getAgency } from "@/lib/actions/agency"
import { requireProfile } from "@/lib/auth/get-session"
import { TeamClient } from "@/components/team/team-client"

export default async function TeamPage() {
  const [profile, agency] = await Promise.all([
    requireProfile(),
    getAgency(),
  ])

  if (!agency) return null

  return (
    <TeamClient 
      currentProfile={profile} 
      agency={agency}
    />
  )
}
