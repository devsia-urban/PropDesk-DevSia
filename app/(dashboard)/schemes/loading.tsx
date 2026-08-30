import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function SchemesLoading() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Skeleton className="h-12 w-full md:w-96 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
