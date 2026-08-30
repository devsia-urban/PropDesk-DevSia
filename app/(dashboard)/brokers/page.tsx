export const dynamic = "force-dynamic";
import React from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { BrokerList } from "@/components/brokers/broker-list"
import { getBrokers } from "@/lib/actions/brokers"
import { getProfile } from "@/lib/auth/get-session"

import { redirect } from "next/navigation"

interface BrokersPageProps {
  searchParams: Promise<{
    search?: string
    broker_type?: string
    specialty?: string
    page?: string
  }>
}

export default async function BrokersPage(props: BrokersPageProps) {
  const profile = await getProfile()
  
  // 🛡️ SECURITY LOCK: Agents cannot access the Brokers network
  if (profile?.role === 'agent') {
    redirect('/dashboard')
  }

  const isReadOnly = profile?.subscription_status === 'paused' && !profile?.is_super_admin

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brokers Network</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your external agent partnerships</p>
        </div>
        {!isReadOnly && (
          <Link
            href="/brokers/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-slate-900 hover:bg-slate-800 cursor-pointer text-white border-none rounded-xl h-10 px-5 flex items-center gap-2 font-bold"
            )}
          >
            <Plus className="w-4 h-4" />
            Add Broker
          </Link>
        )}
      </div>

      <BrokerList />
    </div>
  )
}
