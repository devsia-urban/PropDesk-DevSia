'use client'

import React, { useState, useMemo, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MatchWithDetails } from "@/lib/types/database"
import { MatchCard } from "@/components/matches/match-card"
import { toast } from "sonner"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { getMatches } from "@/lib/actions/matches"
import { useDebounce } from "use-debounce"

export function MatchList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)

  const [search, setSearch] = useState(searchParams.get('search') ?? "")
  const [minScore, setMinScore] = useState(searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : 40)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? "All")
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? "Highest match")
  const currentPage = parseInt(searchParams.get('page') || "1")

  const [debouncedSearch] = useDebounce(search, 400)

  const updateFilters = (updates: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
      else params.delete(key)
    })
    if (!updates.page) params.set('page', '1')
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filtersKey = {
    minScore,
    status: statusFilter,
    search: debouncedSearch,
    sortBy,
    page: currentPage,
  }

  const { data, isLoading, mutate, error } = useSWR(['matchesList', filtersKey], ([, f]) => getMatches(f as any), {
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const matches = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = data?.totalPages || 0

  const highConfidence = matches.filter(m => m.score >= 90).length
  const unreviewed = matches.filter(m => m.status === "new").length

  const runMatchForAll = async () => {
    setIsRunning(true)
    try {
      const res = await fetch("/api/matches/run", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`Match engine complete — ${data.totalMatches ?? data.matchCount} matches found`)
        mutate()
      } else {
        toast.error(data.error || "Match engine failed")
      }
    } catch {
      toast.error("Failed to run match engine")
    } finally {
      setIsRunning(false)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setMinScore(40)
    setStatusFilter("All")
    setSortBy("Highest match")
    updateFilters({ search: "", minScore: 40, status: "All", sortBy: "Highest match", page: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Run Match + Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <StatPill
            icon={<Sparkles className="w-4 h-4" />}
            color="amber"
            label={`${totalCount} matches found`}
          />
          <StatPill
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="emerald"
            label={`${highConfidence} high confidence (90%+)`}
          />
          <StatPill
            icon={<Clock className="w-4 h-4" />}
            color="slate"
            label={`${unreviewed} unreviewed`}
          />
        </div>
        <Button
          onClick={runMatchForAll}
          disabled={isRunning}
          className="bg-amber-500 hover:bg-amber-600 text-white border-none rounded-xl h-11 px-6 flex items-center gap-2 font-bold shadow-lg shadow-amber-100 shrink-0"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRunning ? "Running…" : "Run match for all"}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Search */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Search
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="Client or property name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') updateFilters({ search })
                }}
                className="pl-10 h-11 rounded-xl bg-slate-50 text-slate-700 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Score Slider */}
          <div className="lg:col-span-3 space-y-3 px-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Min match score
              </label>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {minScore}%+
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={minScore}
              onChange={e => {
                const val = parseInt(e.target.value)
                setMinScore(val)
                updateFilters({ minScore: val })
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Sort */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Sort by
            </label>
            <Select 
              value={sortBy} 
              onValueChange={v => {
                if (!v) return
                setSortBy(v)
                updateFilters({ sortBy: v })
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-transparent font-medium">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Highest match">Highest match</SelectItem>
                <SelectItem value="Newest first">Newest first</SelectItem>
                <SelectItem value="Client name">By client name</SelectItem>
                <SelectItem value="Property price">By property price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Button
              variant="ghost"
              className="h-11 w-full text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Status:
          </span>
          <div className="flex flex-wrap gap-2">
            {["All", "New", "Reviewed", "Contacted"].map(s => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s)
                  updateFilters({ status: s })
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                  statusFilter === s
                    ? "bg-slate-800 text-white border-slate-800 shadow-md"
                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {isLoading && (
           <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-[2rem] flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
           </div>
        )}
        
        {error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-red-50 rounded-[2rem] border border-red-100 border-dashed">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
              <X className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              Connection Error
            </h2>
            <p className="text-slate-500 text-center max-w-sm mb-8 font-medium">
              Could not fetch matches. Please try again.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-black text-sm hover:border-slate-200 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : isLoading && matches.length === 0 ? (
           Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-4">
               <div className="flex gap-4">
                 <Skeleton className="w-16 h-16 rounded-xl" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-5 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
                 </div>
               </div>
               <Skeleton className="h-24 w-full rounded-xl" />
             </div>
           ))
        ) : matches.length > 0 ? (
          matches.map((match: any) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">No matches found</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                Try adjusting the minimum score filter or run the match engine.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isLoading}
            onClick={() => updateFilters({ page: currentPage - 1 })}
            className="rounded-lg font-bold"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-300 px-1">...</span>}
                  <Button
                    variant={currentPage === p ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0 rounded-lg font-bold",
                      currentPage === p ? "bg-slate-800" : "text-slate-500"
                    )}
                    disabled={isLoading}
                    onClick={() => updateFilters({ page: p })}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || isLoading}
            onClick={() => updateFilters({ page: currentPage + 1 })}
            className="rounded-lg font-bold"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function StatPill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode
  label: string
  color: "amber" | "emerald" | "slate"
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold",
        colors[color]
      )}
    >
      {icon}
      {label}
    </div>
  )
}
