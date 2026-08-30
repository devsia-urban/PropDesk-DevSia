'use client'

import React, { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  UserPlus,
  Sparkles,
  Building2,
  Bell,
  X,
  ArrowRight,
  Inbox,
  Phone,
  UserCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Activity } from "@/lib/actions/activities"
import { MatchWithDetails } from "@/lib/types/database"
import { formatRelativeTime } from "@/lib/utils/format"
import { RelativeTime } from "@/components/ui/relative-time"

const TABS = [
  { label: "Recent activities", id: "activities" },
  { label: "Matches", id: "matches" },
]

function dateGroup(createdAt: string): 'Today' | 'Yesterday' | 'Earlier this week' | 'Older' {
  const d = new Date(createdAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'Earlier this week'
  return 'Older'
}

interface NotificationsClientProps {
  initialActivities: Activity[]
  initialMatches: MatchWithDetails[]
}

export function NotificationsClient({ initialActivities, initialMatches }: NotificationsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("activities")

  const mergedItems = useMemo(() => {
    const combined = [
      ...initialActivities.map(a => ({
        ...a,
        itemType: 'activity' as const,
        sortDate: a.created_at
      })),
      ...initialMatches.map(m => ({
        ...m,
        itemType: 'match_entry' as const,
        sortDate: m.matched_at,
        id: m.id,
        created_at: m.matched_at
      }))
    ]
    return combined.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
  }, [initialActivities, initialMatches])

  const filteredItems = useMemo(() => {
    if (activeTab === "activities") return mergedItems.filter(i => i.itemType === 'activity')
    if (activeTab === "matches") return mergedItems.filter(i => i.itemType === 'match_entry')
    return mergedItems
  }, [mergedItems, activeTab])

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {
      Today: [],
      Yesterday: [],
      'Earlier this week': [],
      Older: [],
    }
    filteredItems.forEach(item => {
      const g = dateGroup(item.sortDate)
      groups[g].push(item)
    })
    return groups
  }, [filteredItems])

  const handleItemClick = (item: any) => {
    if (item.itemType === 'match_entry') {
      router.push(`/matches/${item.id}`)
    } else if (item.itemType === 'activity') {
      const a = item as Activity
      if (a.action === 'delete') return
      const link =
        a.entity_type === "client" ? `/clients/${a.entity_id}` :
          a.entity_type === "property" ? `/properties/${a.entity_id}` :
            a.entity_type === "unit" ? `/schemes/unit/${a.entity_id}` :
              a.entity_type === "match" ? `/matches/${a.entity_id}` :
                "/notifications"
      router.push(link)
    }
  }

  if (mergedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center animate-in zoom-in-95">
          <Inbox className="w-10 h-10 text-slate-200" />
        </div>
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-bold text-slate-800">You're all caught up!</h3>
          <p className="text-slate-500 text-sm font-medium">No recent activities or matches found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                isActive
                  ? "text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Notification/Activity List */}
      <div className="space-y-8 pt-2">
        {Object.entries(groupedItems).map(([group, list]) => {
          if (list.length === 0) return null
          return (
            <div key={group} className="space-y-4">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {group}
              </h2>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 divide-y divide-slate-50">
                {list.map(item => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-6 text-center">
        <Link href="/settings" className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-2">
          Manage notification preferences
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function ActivityItem({ item, onClick }: { item: any, onClick: () => void }) {
  const content = (item: any) => {
    if (item.itemType === 'match_entry') {
      return {
        icon: Sparkles,
        colors: "bg-amber-50 text-amber-600",
        title: `${item.score}% Match Found`,
        message: `${item.client?.full_name} matches with ${item.property?.title}`
      }
    }

    const a = item as Activity
    const isAssignment = a.details?.title?.toLowerCase().startsWith('new lead assigned:')

    const IconMap = {
      create: UserPlus,
      update: Building2,
      delete: Inbox,
      match: Sparkles,
      share: ArrowRight,
      view: Building2,
      assign: UserCheck,
      call: Phone,
      hold: Lock,
      booked: CheckCircle2,
      cancelled: XCircle,
      released: Clock,
      converted: CheckCircle2,
    }
    const colorMap = {
      create: "bg-emerald-50 text-emerald-600",
      update: "bg-blue-50 text-blue-600",
      delete: "bg-red-50 text-red-600",
      match: "bg-amber-50 text-amber-600",
      share: "bg-purple-50 text-purple-600",
      view: "bg-slate-50 text-slate-600",
      assign: "bg-indigo-50 text-indigo-600",
      call: "bg-emerald-50 text-emerald-600",
      hold: "bg-amber-50 text-amber-600",
      booked: "bg-emerald-50 text-emerald-600",
      cancelled: "bg-red-50 text-red-600",
      released: "bg-slate-50 text-slate-600",
      converted: "bg-emerald-50 text-emerald-600",
    }

    if (isAssignment) {
      return {
        icon: UserPlus,
        colors: "bg-emerald-50 text-emerald-600",
        title: "New lead assigned to you",
        message: a.details.title.split(':').pop()?.trim() || a.details.title
      }
    }

    const actionLabels: Record<string, string> = {
      create: 'Added new',
      update: 'Updated',
      share: 'Shared',
      delete: 'Removed',
      view: 'Viewed',
      assign: 'Assigned',
      call: 'Called',
      hold: 'Placed hold on',
      booked: 'Sold',
      cancelled: 'Cancelled booking of',
      released: 'Released hold on',
      converted: 'Sold',
    }

    return {
      icon: (IconMap as any)[a.action] || Bell,
      colors: (colorMap as any)[a.action] || "bg-slate-50 text-slate-600",
      title: a.profiles?.full_name || 'Team Action',
      message: `${actionLabels[a.action] || 'Interacted with'} ${a.details?.title || a.entity_type}`
    }
  }

  const { icon: Icon, colors: iconColors, title, message } = content(item)
  const isClickable = item.itemType === 'match_entry' || item.action !== 'delete'

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "flex gap-4 p-4 transition-all group relative",
        isClickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
        "border-l-2 border-transparent"
      )}
    >
      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", iconColors)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>
        <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
          {message}
        </p>
        <RelativeTime
          date={item.sortDate}
          className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block pt-1"
        />
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/80 backdrop-blur px-1 py-1 rounded-lg border border-slate-100 shadow-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-md">
                  <X className="w-4 h-4" />
                </Button>
              } />
              <TooltipContent className="bg-red-500 text-white border-none py-1 px-2 rounded-md">
                <p className="text-[10px] font-bold">Dismiss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
