export const dynamic = "force-dynamic";
import React from "react"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getBrokerById } from "@/lib/actions/brokers"
import { BrokerDetailView } from "@/components/brokers/broker-detail-view"

interface BrokerPageProps {
  params: Promise<{ id: string }>
}

export default async function BrokerPage({ params }: BrokerPageProps) {
  const { id } = await params
  const broker = await getBrokerById(id)

  if (!broker) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link 
        href="/brokers" 
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Back to Network
      </Link>

      <BrokerDetailView broker={broker as any} />
    </div>
  )
}
