'use client'

import React, { useState } from "react"
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Search,
  Zap,
  XCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getAllAgencies } from "@/lib/actions/admin"
import { CreateAgencyDialog } from "@/components/admin/create-agency-dialog"
import { AgencyCard } from "@/components/admin/agency-card"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"

function StatCard({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <Card className="border-slate-100 bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      </div>
    </Card>
  )
}

export function SuperAdminClient() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: dbAgencies, isLoading, error, mutate } = useSWR('superadmin-agencies', () => getAllAgencies())

  const getProcessedAgencies = () => {
    if (!dbAgencies) return []
    
    // Dynamically mark as expired if the end date has passed
    let rawAgencies = dbAgencies.map(agency => {
      if ((agency.subscription_status === 'trial' || agency.subscription_status === 'active') && agency.subscription_end_date) {
        const isExpired = new Date(agency.subscription_end_date).getTime() < Date.now()
        if (isExpired) {
          return { ...agency, subscription_status: 'expired' as const }
        }
      }
      return agency
    })

    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      rawAgencies = rawAgencies.filter(a => a.name.toLowerCase().includes(lower))
    }

    // Sort agencies:
    // 1. Active trials / active plans first
    // 2. Expired last
    // 3. Sort by end date ascending (closest to expire first) for active, descending for expired
    return rawAgencies.sort((a, b) => {
      const statusWeight: Record<string, number> = { 'trial': 1, 'active': 1, 'paused': 2, 'expired': 3 }
      const weightA = statusWeight[a.subscription_status] || 9
      const weightB = statusWeight[b.subscription_status] || 9
      
      if (weightA !== weightB) return weightA - weightB
      
      // If both have same status, sort by end date
      const dateA = a.subscription_end_date ? new Date(a.subscription_end_date).getTime() : 0
      const dateB = b.subscription_end_date ? new Date(b.subscription_end_date).getTime() : 0
      
      if (weightA === 3) {
        // For expired, show most recently expired first
        return dateB - dateA
      }
      // For active/trial, show ones closest to expiry first
      return dateA - dateB
    })
  }

  const agencies = getProcessedAgencies()

  // Calculate platform metrics
  const totalAgencies = agencies.length
  const totalMembers = agencies.reduce((acc, a) => acc + (a.profiles?.[0]?.count || 0), 0)
  const activeTrials = agencies.filter(a => a.subscription_status === 'trial').length
  const activePaid = agencies.filter(a => a.subscription_status === 'active').length

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
        <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-[3rem] border border-red-100 border-dashed">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 text-center max-w-sm mb-6">Could not load platform data.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition-all shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      {/* Header & Stats Bundle */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Control
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Platform <br className="md:hidden" /> Dashboard
            </h1>
            <p className="text-slate-500 font-medium text-lg">Manage global agency subscriptions and access.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
             <div className="relative group w-full md:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
               <Input 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 id="platform-agency-search"
                 placeholder="Search agencies..."
                 className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-emerald-500"
               />
             </div>
             <CreateAgencyDialog />
          </div>
        </div>

        {/* Stats Row */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-slate-100 bg-white p-6 rounded-[2rem] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Agencies" value={totalAgencies} sub="Registered" icon={Building2} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Total Members" value={totalMembers} sub="Platform-wide" icon={Users} color="text-purple-600" bg="bg-purple-50" />
            <StatCard label="Active Trials" value={activeTrials} sub="Prospects" icon={Zap} color="text-amber-600" bg="bg-amber-50" />
            <StatCard label="Paid Members" value={activePaid} sub="Revenue Generating" icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-50" />
          </div>
        )}
      </div>

      {/* Agency List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Agencies
            {!isLoading && <Badge variant="outline" className="rounded-full border-slate-200 text-slate-500">{agencies.length}</Badge>}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-slate-100 bg-white p-6 rounded-[2rem] shadow-sm space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
                <Skeleton className="w-1/2 h-4" />
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <Skeleton className="w-12 h-4" />
                  <Skeleton className="w-12 h-4" />
                </div>
              </Card>
            ))}
          </div>
        ) : agencies.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 leading-tight">No Agencies Found</h3>
              <p className="text-slate-500 font-medium max-w-sm">The platform is ready. New agencies will appear here as soon as they sign up or are created.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
