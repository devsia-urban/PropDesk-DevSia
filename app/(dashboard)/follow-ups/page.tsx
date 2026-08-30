export const dynamic = "force-dynamic";
import React from "react"
import { requireProfile } from "@/lib/auth/get-session"
import { redirect } from "next/navigation"
import { FollowUpsClient } from "@/components/follow-ups/follow-ups-client"

export default async function FollowUpsPage() {
  const profile = await requireProfile()

  if (profile.is_super_admin) {
    redirect("/superadmin")
  }

  return <FollowUpsClient />
}
