export const dynamic = "force-dynamic";
import React from "react"
import { requireProfile } from "@/lib/auth/get-session"
import { ClientDetailClient } from "@/components/clients/client-detail-client"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()
  
  return <ClientDetailClient id={id} profile={profile as any} />
}
