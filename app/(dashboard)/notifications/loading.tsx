import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div>
        <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 pt-1">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
