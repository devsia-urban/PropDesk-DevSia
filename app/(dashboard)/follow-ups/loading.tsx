import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
