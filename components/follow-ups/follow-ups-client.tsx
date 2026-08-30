'use client'

import React, { useState } from "react"
import { getUpcomingFollowUps, getOverdueFollowUps } from "@/lib/actions/clients"
import { FollowUpWidget } from "@/components/dashboard/follow-up-widget"
import { CalendarClock, Clock, AlertCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"

export function FollowUpsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const defaultTab = searchParams.get('tab') === 'overdue' ? 'overdue' : 'upcoming'

  const fetcher = async () => {
    const [upcoming, overdue] = await Promise.all([
      getUpcomingFollowUps(),
      getOverdueFollowUps()
    ])
    return { upcoming, overdue }
  }

  const { data, isLoading, error, mutate } = useSWR('follow-ups', fetcher)
  
  const upcoming = data?.upcoming || []
  const overdue = data?.overdue || []

  const updateTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-emerald-500" />
          Follow-ups
        </h1>
        <p className="text-slate-500">Manage all your upcoming and overdue client meetings & calls.</p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={updateTab} className="w-full">
        <TabsList className="mb-6 bg-slate-100/70 p-1.5 rounded-2xl h-auto flex max-w-fit">
          <TabsTrigger 
            value="upcoming" 
            className="rounded-xl px-6 py-2.5 font-bold data-[active]:bg-white data-[active]:text-emerald-700 data-[active]:shadow-sm text-slate-500 hover:text-slate-700 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Upcoming {isLoading ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : `(${upcoming.length})`}
          </TabsTrigger>
          <TabsTrigger 
            value="overdue" 
            className="rounded-xl px-6 py-2.5 font-bold data-[active]:bg-white data-[active]:text-red-600 data-[active]:shadow-sm text-slate-500 hover:text-slate-700 flex items-center gap-2 ml-1"
          >
            <AlertCircle className="w-4 h-4" />
            Overdue {isLoading ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : `(${overdue.length})`}
          </TabsTrigger>
        </TabsList>

        {error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-2xl border border-red-100 border-dashed">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 text-center max-w-sm mb-6">Could not fetch follow-ups.</p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>

        <TabsContent value="upcoming" className="w-full">
          <FollowUpWidget 
            followUps={upcoming} 
            title="Upcoming Follow-ups" 
            emptyTitle="No Upcoming Follow-ups"
            emptySub="You have no scheduled follow-ups for the future."
            limit={100}
            hideHeader={true}
            fullPage={true}
          />
        </TabsContent>

        <TabsContent value="overdue" className="w-full">
          <FollowUpWidget 
            followUps={overdue} 
            title="Overdue Meetings" 
            emptyTitle="No Overdue Meetings"
            emptySub="Great job! You are all caught up on your tasks."
            isOverdue={true}
            limit={100}
            hideHeader={true}
            fullPage={true}
          />
          </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
