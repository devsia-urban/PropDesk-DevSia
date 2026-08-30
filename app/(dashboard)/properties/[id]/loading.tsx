import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"

export default function PropertyDetailLoading() {
  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>

        {/* Title, Badges & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
            <Skeleton className="h-8 w-48 rounded-lg mt-4" />
          </div>

          <div className="flex items-center gap-3 self-start">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Image Gallery Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[400px]">
        <div className="md:col-span-3 h-full">
          <Skeleton className="h-full w-full rounded-[2rem]" />
        </div>
        <div className="hidden md:flex flex-col gap-4 h-full">
          <Skeleton className="h-1/2 w-full rounded-3xl" />
          <Skeleton className="h-1/2 w-full rounded-3xl" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Info Grid */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 md:p-8 space-y-6">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-8 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 mb-6 rounded-lg" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between py-3 border-b border-slate-100">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 mb-6 rounded-lg" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between py-3 border-b border-slate-100">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6">
          
          {/* Linked Client / Seller Widget */}
          <Card className="border border-slate-100 bg-slate-50/50 rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl mt-4" />
            </CardContent>
          </Card>

          {/* Booking / Matches Widget */}
          <Card className="border border-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
