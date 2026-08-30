export const dynamic = "force-dynamic";
import React from "react"
import { getProfile } from "@/lib/auth/get-session"
import { BookingsClient } from "@/components/bookings/bookings-client"

export default async function BookingsPage() {
  const profile = await getProfile()
  const isAdmin = profile?.role === 'admin'
  return <BookingsClient isAdmin={isAdmin} />
}
