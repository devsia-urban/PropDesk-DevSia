export const dynamic = "force-dynamic";
import React from "react"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getBrokerById } from "@/lib/actions/brokers"
import { BrokerForm } from "@/components/brokers/broker-form"

interface EditBrokerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBrokerPage({ params }: EditBrokerPageProps) {
  const { id } = await params
  const broker = await getBrokerById(id)

  if (!broker) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-4">
        <Link
          href={`/brokers/${id}`}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Profile
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Broker Profile</h1>
          <p className="text-slate-500 font-medium">Update contact info or specialty tags for {broker.full_name}.</p>
        </div>
      </div>

      <BrokerForm initialData={broker as any} />
    </div>
  )
}
