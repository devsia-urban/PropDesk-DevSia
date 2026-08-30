export const dynamic = "force-dynamic";
import React from "react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

import { getDashboardData } from "@/lib/actions/dashboard"

export default function DashboardPage() {
  // We no longer block the server with await getDashboardData().
  // This allows Next.js to instantly transition the page and display the DashboardClient skeleton,
  // which will seamlessly fetch the parallelized data via SWR on the client side.
  return <DashboardClient />
}
