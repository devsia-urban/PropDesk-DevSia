export const dynamic = "force-dynamic";
import React from "react"
import { Sparkles } from "lucide-react"
import { getMatches } from "@/lib/actions/matches"
import { MatchList } from "@/components/matches/match-list"

export default async function SmartMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ minScore?: string; status?: string; search?: string; sortBy?: string; page?: string }>
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart matches</h1>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Properties matched to client requirements by the matching engine
          </p>
        </div>
      </div>

      <MatchList />
    </div>
  )
}
