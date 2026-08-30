import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TownshipsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shrink-0 bg-slate-100" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 bg-slate-100" />
                  <Skeleton className="h-3 w-32 bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-9 w-32 rounded-xl bg-slate-100" />
                <Skeleton className="h-9 w-9 rounded-xl bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-11 w-11 rounded-2xl bg-slate-100" />
            <Skeleton className="h-5 w-24 rounded-full bg-slate-100" />
          </div>
          <Skeleton className="h-8 w-16 mb-2 bg-slate-100" />
          <Skeleton className="h-3 w-32 bg-slate-100" />
        </CardContent>
      </Card>
    </div>
  )
}
