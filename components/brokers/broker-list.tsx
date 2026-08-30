'use client'

import React, { useState, useMemo, useTransition } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  Handshake,
  LayoutGrid,
  List,
  Download,
  MapPin,
  Star
} from "lucide-react"
import Link from "next/link"
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
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { BrokerRow } from "@/components/brokers/broker-row"
import { BrokerCard } from "@/components/brokers/broker-card"
import { Broker } from "@/lib/types/database"
import { exportToExcel } from "@/lib/utils/export-utils"
import { deleteBroker } from "@/lib/actions/brokers"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "use-debounce"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import useSWR from "swr"
import { getBrokers } from "@/lib/actions/brokers"
import { Skeleton } from "@/components/ui/skeleton"

interface BrokerListProps {}

const COMMON_SPECIALTIES = [
  "Plots", "Luxury Apartments", "Villas", "Commercial Office",
  "Retail Space", "Industrial", "Agriculture Land", "Farmhouses",
  "Rentals", "Resale"
]

export function BrokerList({}: BrokerListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // ── Unified Server-Driven Filters ──
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("broker_type") || "any")
  const [specialtyFilter, setSpecialtyFilter] = useState(searchParams.get("specialty") || "any")
  const currentPage = parseInt(searchParams.get("page") || "1")

  const [debouncedSearch] = useDebounce(searchValue, 400)

  // Sync state to URL
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedSearch) params.set("search", debouncedSearch)
    else params.delete("search")

    if (typeFilter !== "any") params.set("broker_type", typeFilter)
    else params.delete("broker_type")

    if (specialtyFilter !== "any") params.set("specialty", specialtyFilter)
    else params.delete("specialty")

    // Reset page on filter change
    const hasFilterChanged =
      debouncedSearch !== (searchParams.get("search") || "") ||
      typeFilter !== (searchParams.get("broker_type") || "any") ||
      specialtyFilter !== (searchParams.get("specialty") || "any")

    if (hasFilterChanged) {
      params.set("page", "1")
    }

    router.push(`/brokers?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, typeFilter, specialtyFilter])

  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [brokerToDelete, setBrokerToDelete] = useState<string | null>(null)

  const filtersKey = {
    search: debouncedSearch,
    broker_type: typeFilter,
    specialty: specialtyFilter,
    page: currentPage,
  }

  const { data, isLoading, error, mutate } = useSWR(['brokers', filtersKey], ([, f]) => getBrokers(f as any), {
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const filtered = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = data?.totalPages || Math.ceil(totalCount / 30) || 1

  const hasActiveFilters = searchValue || typeFilter !== "any" || specialtyFilter !== "any"

  const resetFilters = () => {
    setSearchValue("")
    setTypeFilter("any")
    setSpecialtyFilter("any")
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`/brokers?${params.toString()}`, { scroll: true })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedBrokers(checked ? filtered.map(b => b.id) : [])
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBrokers(prev => [...prev, id])
    } else {
      setSelectedBrokers(prev => prev.filter(bId => bId !== id))
    }
  }

  const handleDeleteBroker = (id: string) => {
    setBrokerToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!brokerToDelete) return
    const { error: delError } = await deleteBroker(brokerToDelete)
    if (delError) {
      toast.error(delError)
    } else {
      toast.success("Broker removed")
      mutate()
    }
    setIsDeleteDialogOpen(false)
    setBrokerToDelete(null)
  }

  const handleExport = () => {
    const dataToExport = filtered.map(b => ({
      'Full Name': b.full_name,
      'Type': b.broker_type,
      'Rating': `${b.rating}/5`,
      'Phones': b.phones?.join(", "),
      'Email': b.email || 'N/A',
      'Agency': b.company_name || 'N/A',
      'Operating Area': b.area || 'N/A',
      'Specialties': b.specialties?.join(", "),
      'Created At': new Date(b.created_at).toLocaleDateString(),
    }))
    exportToExcel(dataToExport, `brokers_export_${new Date().toISOString().split('T')[0]}`)
  }


  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 space-y-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
            <Input
              placeholder="Search by name, phone, area or agency..."
              className={cn(
                "pl-11 h-12 bg-slate-50 border-none rounded-2xl focus:bg-white transition-all text-slate-800",
                isLoading && "opacity-70 animate-pulse"
              )}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-12 px-6 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>

            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn("h-9 w-9 rounded-xl transition-all", viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn("h-9 w-9 rounded-xl transition-all", viewMode === "list" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Link href="/brokers/new">
              <Button className="h-12 cursor-pointer px-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all gap-2">
                <Plus className="w-4 h-4" />
                <span>Add Broker</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 mr-1">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "any")}>
            <SelectTrigger className={cn(
              "h-10 px-4 text-xs font-bold rounded-xl border-none transition-all",
              typeFilter !== "any" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}>
              <SelectValue placeholder="Broker Type" />
            </SelectTrigger>
            <SelectContent className="bg-white font-bold">
              <SelectItem value="any">All Types</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="agency">Agency Based</SelectItem>
            </SelectContent>
          </Select>

          <Select value={specialtyFilter} onValueChange={(v) => setSpecialtyFilter(v || "any")}>
            <SelectTrigger className={cn(
              "h-10 px-4 text-xs font-bold rounded-xl border-none transition-all",
              specialtyFilter !== "any" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}>
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent className="bg-white font-bold max-h-[300px]">
              <SelectItem value="any">Any Specialty</SelectItem>
              {COMMON_SPECIALTIES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 h-9 px-3 text-xs text-red-500 font-bold rounded-xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}

          <span className="ml-auto text-xs text-slate-500 font-semibold italic">
            Showing page {currentPage} of {totalPages || 1} ({totalCount} total)
          </span>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-[2rem] border border-red-100 border-dashed">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 text-center max-w-sm mb-6">Failed to fetch brokers.</p>
          <Button variant="outline" onClick={() => mutate()}>Retry</Button>
        </div>
      ) : isLoading && filtered.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "list" ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="h-10 text-right pr-6 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Actions</TableHead>
                    <TableHead className="h-10 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Broker</TableHead>
                    <TableHead className="h-10 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Contact</TableHead>
                    <TableHead className="h-10 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Agency / Area</TableHead>
                    <TableHead className="h-10 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Specialties</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((broker) => (
                    <BrokerRow
                      key={broker.id}
                      broker={broker}
                      isSelected={selectedBrokers.includes(broker.id)}
                      onSelect={handleSelectOne}
                      onDelete={handleDeleteBroker}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(broker => (
              <BrokerCard key={broker.id} broker={broker} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-slate-100 border-dashed">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
            <Handshake className="w-12 h-12 text-slate-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            {hasActiveFilters ? "No matches found" : "No brokers yet"}
          </h2>
          <p className="text-slate-500 text-center max-w-sm mb-8 font-medium">
            {hasActiveFilters ? "Try adjusting your search or filters." : "Start building your network by adding your first broker."}
          </p>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outline"
              className="h-12 px-8 rounded-2xl border-2 border-slate-100 text-slate-700 font-black text-sm"
            >
              Clear Selection
            </Button>
          )}
        </div>
      )}

      {/* ── Delete Confirmation ────────────────────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white rounded-3xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Remove Broker?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 pt-1 font-medium">
              This will remove the broker from your active network list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1 border-slate-200 rounded-2xl font-bold" onClick={() => { setIsDeleteDialogOpen(false); setBrokerToDelete(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none rounded-2xl font-bold" onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Pagination Footer ─────────────────────── */}
      <div className="flex items-center justify-between gap-4 mt-8 pb-10 border-t border-slate-100 pt-6">
        <div className="flex-1 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-xl border-2 border-slate-200 font-bold text-slate-600 disabled:opacity-50 h-10 px-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-xl border-2 border-slate-200 font-bold text-slate-600 disabled:opacity-50 h-10 px-4"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current
            let pageNum = currentPage
            if (totalPages <= 5) pageNum = i + 1
            else if (currentPage <= 3) pageNum = i + 1
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
            else pageNum = currentPage - 2 + i

            if (pageNum <= 0 || pageNum > totalPages) return null

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(pageNum)}
                className={cn(
                  "h-10 w-10 rounded-xl font-bold transition-all",
                  currentPage === pageNum
                    ? "bg-slate-900 hover:bg-slate-800 text-white border-none shadow-lg shadow-slate-100"
                    : "border-2 border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {pageNum}
              </Button>
            )
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="text-slate-400 font-bold px-2">...</span>
          )}
        </div>

        <div className="flex-1 flex justify-end">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>
    </div>
  )
}
