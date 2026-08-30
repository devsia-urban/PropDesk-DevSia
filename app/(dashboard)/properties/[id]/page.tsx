export const dynamic = "force-dynamic";
import React from "react"
import { PropertyDetailClient } from "@/components/properties/property-detail-client"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <PropertyDetailClient id={id} />
}
