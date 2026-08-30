'use client'

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  Users,
  Sparkles,
  Clock,
  TrendingUp,
  UserPlus,
  ArrowRight,
  MapPin,
  AreaChartIcon,
  Phone,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { RelativeTime } from "@/components/ui/relative-time"
import { FollowUpWidget } from "@/components/dashboard/follow-up-widget"
import { formatPrice } from "@/lib/utils/format"
import { formatDistanceToNow } from "date-fns"
import useSWR from "swr"
import { getDashboardData } from "@/lib/actions/dashboard"

function activityIcon(type: string) {
  const map: Record<string, typeof Building2> = {
    create: UserPlus,
    update: Building2,
    delete: Clock,
    match: Sparkles,
    assign: UserPlus,
    call: Phone,
    hold: Lock,
    booked: CheckCircle2,
    cancelled: XCircle,
    released: Clock,
    converted: CheckCircle2,
  }
  return map[type] ?? Clock
}

function activityColor(type: string) {
  const map: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-600",
    update: "bg-blue-100 text-blue-600",
    delete: "bg-red-100 text-red-600",
    match: "bg-amber-100 text-amber-600",
    assign: "bg-purple-100 text-purple-600",
    call: "bg-indigo-100 text-indigo-600",
    hold: "bg-amber-100 text-amber-600",
    booked: "bg-emerald-100 text-emerald-600",
    cancelled: "bg-red-100 text-red-600",
    released: "bg-slate-100 text-slate-600",
    converted: "bg-emerald-100 text-emerald-600",
  }
  return map[type] ?? "bg-slate-100 text-slate-600"
}

const allQuickActions = [
  {
    label: "Add property",
    icon: Building2,
    href: "/properties/new",
    cls: "bg-emerald-500 hover:bg-emerald-600 text-white",
    adminOnly: false,
  },
  {
    label: "Add lead",
    icon: UserPlus,
    href: "/clients/new",
    cls: "bg-slate-900 hover:bg-slate-800 text-white",
    adminOnly: false,
  },
  {
    label: "View matches",
    icon: Sparkles,
    href: "/matches",
    cls: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    adminOnly: false,
  },
]

export function DashboardClient({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const { data, isLoading } = useSWR('dashboardData', getDashboardData, {
    fallbackData: initialData,
    revalidateOnFocus: true,
    dedupingInterval: 10000, // 10 seconds
  })

  // Redirect superadmins immediately when data loads
  if (data?.profile?.is_super_admin) {
    router.replace("/superadmin")
    return null
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-[2rem] border border-slate-100 p-6">
            <Skeleton className="h-6 w-48 mb-6 rounded-lg" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          </div>
          <div className="h-96 bg-white rounded-[2rem] border border-slate-100 p-6">
            <Skeleton className="h-6 w-48 mb-6 rounded-lg" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const {
    profile,
    stats,
    recentActivities,
    recentProperties,
    followUps,
    overdueFollowUps,
  } = data

  const propertiesResult = recentProperties as any
  const properties = propertiesResult?.data || (Array.isArray(recentProperties) ? recentProperties : [])

  const statCards = [
    {
      label: "Properties",
      value: stats.properties,
      icon: Building2,
      sub: "total listings",
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/properties",
    },
    {
      label: "Active clients",
      value: stats.clients,
      icon: Users,
      sub: "seeking property",
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/clients",
    },
    {
      label: "Available Plots",
      value: (stats as any).availablePlots,
      icon: Building2,
      sub: `${(stats as any).townships} townships`,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/schemes",
    },
    {
      label: "Upcoming follow-ups",
      value: followUps.length,
      icon: Clock,
      sub: "scheduled",
      color: followUps.length > 0 ? "text-emerald-600" : "text-slate-400",
      bg: followUps.length > 0 ? "bg-emerald-50" : "bg-slate-50",
      href: "/clients",
    },
  ]

  return (
    <div className="space-y-5 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {statCards.map(stat => (
          <Link key={stat.label} href={stat.href} className="block group">
            <Card className="border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative h-full">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <div className={cn("p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4 md:w-5 md:h-5", stat.color)} />
                  </div>
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1 md:mt-2 uppercase tracking-wider">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Follow-ups Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpWidget 
          followUps={overdueFollowUps} 
          title="Overdue meetings"
          emptyTitle="No overdue meetings"
          emptySub="You are all caught up on past follow-ups."
          isOverdue={true} 
        />
        <FollowUpWidget followUps={followUps} />
      </div>

      {/* Activity & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent activity</h2>
            <Link href="/notifications" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>
          <Card className="border-slate-100/60 bg-white/60 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentActivities.map(activity => {
                  const Icon = activityIcon(activity.action)
                  const href = (activity.action === 'delete') ? null :
                    activity.entity_type === "client" ? `/clients/${activity.entity_id}` :
                    activity.entity_type === "property" ? `/properties/${activity.entity_id}` :
                    activity.entity_type === "unit" ? `/schemes/unit/${activity.entity_id}` :
                    activity.entity_type === "match" ? `/matches/${activity.entity_id}` : "/dashboard"

                  const isMe = activity.user_id === profile.id
                  let actorName = isMe ? "You" : activity.profiles?.full_name
                  let actionText = ""
                  let entityName = activity.details?.title || activity.details?.name || `${activity.entity_type} #${activity.entity_id.slice(0, 4)}`

                  if (entityName.includes('undefined')) {
                    entityName = `${activity.entity_type} #${activity.entity_id.slice(0, 4)}`
                  }

                  const verbs: Record<string, string> = {
                    create: activity.entity_type === 'property' ? 'listed' : 'onboarded',
                    update: 'updated',
                    delete: 'removed',
                    match: 'connected',
                    share: 'shared',
                    view: 'viewed',
                    assign: 'assigned',
                    call: 'called the client',
                    hold: 'hold',
                    booked: 'sold',
                    cancelled: 'cancelled',
                    released: 'released',
                    converted: 'sold',
                  }

                  let actionVerb = verbs[activity.action] || 'has'

                  if (activity.action === 'create' && activity.entity_type === 'property' && activity.details?.booking_type) {
                    actionVerb = activity.details.booking_type === 'hold' ? 'hold' : 'booked'
                  }

                  actionText = `${actionVerb} ${activity.entity_type === 'client' ? '' : activity.entity_type}`
                  if (activity.entity_type === 'unit') actionText = actionVerb + ' unit'

                  if (activity.action === 'assign') {
                    const assignedToMe = activity.details?.assigned_to_id === profile.id
                    actionText = `assigned ${entityName} to ${assignedToMe ? 'you' : (activity.details?.assigned_to_name || 'an agent')}`
                    entityName = "" 
                  }

                  const content = (
                    <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-all duration-300 group cursor-pointer">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", activityColor(activity.action))}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="text-sm font-bold text-slate-900">{actorName}</span>
                          <span className={cn("text-sm font-medium", activity.action === 'assign' ? "text-emerald-600 font-semibold" : "text-slate-500")}>
                            {actionText}
                          </span>
                          {entityName && (
                            <span className="text-sm font-bold text-slate-800">{entityName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )

                  if (!href) return <div key={activity.id}>{content}</div>

                  return (
                    <Link key={activity.id} href={href} className="block">
                      {content}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="p-16 text-center">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-bold">No activity yet</p>
                <p className="text-slate-400 text-xs mt-1">Activity from your team will appear here</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Quick actions</h2>
          <div className="flex flex-col gap-3">
            {allQuickActions
              .filter(action => !action.adminOnly || profile.role === 'admin')
              .map(action => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn("flex items-center gap-3 h-14 px-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm", action.cls)}
                >
                  <action.icon className="w-5 h-5 shrink-0" />
                  {action.label}
                </Link>
              ))}
          </div>
        </div>
      </div>

      {properties.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent properties</h2>
            <Link href="/properties" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.slice(0, 6).map((property: any) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="border-slate-300 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-pointer">
                  <div className="aspect-video w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {property.cover_image_url ? (
                      <img src={property.cover_image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Building2 className="w-10 h-10 text-slate-200" />
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold font-sans text-slate-900 group-hover:text-emerald-600 transition-colors text-sm truncate">
                          {property.title}
                        </h3>
                        <span className="text-sm font-black text-emerald-600 shrink-0">
                          {formatPrice(property.price)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-400 truncate text-xs mt-1">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        {[property.locality, property.city].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex items-center gap-4 text-xs mt-2 text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <AreaChartIcon className="w-3.5 h-3.5 text-slate-300" />
                        {property.area_sqft} {property?.area_unit}
                      </div>
                      <Badge className={cn(
                        "ml-auto text-[10px] font-bold border-none capitalize",
                        property.status === "available" ? "bg-emerald-50 text-emerald-600" :
                        property.status === "sold" ? "bg-red-50 text-red-600" :
                        "bg-slate-50 text-slate-500"
                      )}>
                        {property.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
