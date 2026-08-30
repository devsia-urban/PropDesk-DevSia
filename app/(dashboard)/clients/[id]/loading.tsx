import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24 rounded-xl flex-1 sm:flex-none" />
            <Skeleton className="h-10 w-24 rounded-xl flex-1 sm:flex-none" />
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Card */}
          <Card className="border border-slate-100 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-1 sm:p-2 bg-slate-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 md:h-20 w-full rounded-2xl" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements Card */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 md:p-8 space-y-6">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Area Skeleton */}
          <div className="space-y-4 pt-4">
            <div className="flex gap-4 border-b border-slate-100 pb-2">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <div className="space-y-4 pt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[1.5rem]" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Follow Up Card */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Assigned Agent Card */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note Card */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
