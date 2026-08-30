import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-500">
      {/* Greeting Skeleton */}
      <div className="flex md:items-end">
        <div>
          <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-slate-100 bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 md:w-20 rounded-lg" />
                <Skeleton className="h-4 w-24 md:w-32 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (Activities & Matches) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Actions Skeleton */}
          <Card className="border border-slate-100 bg-white rounded-[1.5rem] md:rounded-[2rem]">
            <CardContent className="p-5 md:p-6">
              <Skeleton className="h-6 w-32 mb-4 rounded-lg" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 md:h-32 rounded-[1.25rem] w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activities Skeleton */}
          <Card className="border border-slate-100 bg-white rounded-[1.5rem] md:rounded-[2rem]">
            <CardContent className="p-5 md:p-6">
              <Skeleton className="h-6 w-40 mb-6 rounded-lg" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <Skeleton className="h-3 w-1/4 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Follow-ups & Notifications) */}
        <div className="space-y-5">
          <Card className="border border-slate-100 bg-white rounded-[1.5rem] md:rounded-[2rem]">
            <CardContent className="p-5 md:p-6">
              <Skeleton className="h-6 w-48 mb-6 rounded-lg" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
