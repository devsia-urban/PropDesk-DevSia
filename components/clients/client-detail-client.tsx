'use client'

import React from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  Pencil,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Sparkles,
  Building2,
  User,
  Plus,
  MapPin,
  IndianRupee,
  BedDouble,
  Ruler,
  Sofa,
  Clock,
  Tag,
  UserCheck,
  AlertCircle,
  Home,
  Handshake,
  ExternalLink,
  History as HistoryIcon,
  Globe,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getClient } from "@/lib/actions/clients"
import { getMatchesForClient } from "@/lib/actions/matches"
import { getClientPropertyLinks } from "@/lib/actions/client-property-links"
import { formatRelativeTime, formatBudgetRange } from "@/lib/utils/format"
import { ClientActionsDropdown } from "@/components/clients/client-actions-dropdown"
import { ClientRunMatchButton } from "@/components/clients/client-run-match-button"
import { ShownPropertiesSection } from "@/components/clients/shown-properties-section"
import { InteractionLogger } from "@/components/clients/interaction-logger"
import { InteractionHistory } from "@/components/clients/interaction-history"
import { QuickFollowupButton } from "@/components/clients/quick-followup-button"
import { CRMCallButton } from "@/components/clients/crm-call-button"
import { CRMWhatsAppButton } from "@/components/clients/crm-whatsapp-button"
import { AssignAgentButton } from "@/components/clients/assign-agent-button"
import { LocalTime } from "@/components/ui/local-time"
import { ClientSellPropertiesSection } from "@/components/clients/client-sell-properties-section"

export function ClientDetailClient({ id, profile }: { id: string, profile: any }) {
  const router = useRouter()

  const fetcher = async () => {
    const [client, clientMatches, propertyLinks] = await Promise.all([
      getClient(id),
      getMatchesForClient(id).catch(() => []),
      getClientPropertyLinks(id).catch(() => []),
    ])
    return { client, clientMatches, propertyLinks }
  }

  const { data, isLoading } = useSWR(`client-detail-${id}`, fetcher)

  if (isLoading || !data) {
    return (
      <div className="space-y-6 pb-24 max-w-[1400px] mx-auto animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4 w-full max-w-md">
             <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
             <Skeleton className="h-8 w-full max-w-[200px]" />
           </div>
           <div className="flex items-center gap-2">
             <Skeleton className="w-10 h-10 rounded-xl" />
             <Skeleton className="w-10 h-10 rounded-xl" />
           </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 w-full rounded-3xl" />
             <Skeleton className="h-40 w-full rounded-3xl" />
           </div>
           <div className="space-y-6">
             <Skeleton className="h-80 w-full rounded-3xl" />
           </div>
        </div>
      </div>
    )
  }

  const { client, clientMatches, propertyLinks } = data

  if (!client) {
    notFound()
    return null
  }

  const initials = client.full_name?.substring(0, 2).toUpperCase() || "C"

  const priorityConfig = {
    high: { label: "High Priority", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
    medium: { label: "Medium Priority", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    low: { label: "Low Priority", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  }
  const priority = priorityConfig[(client.priority as keyof typeof priorityConfig) || "medium"]

  const statusConfig = {
    active: "bg-emerald-100 text-emerald-700",
    matched: "bg-amber-100 text-amber-700",
    closed: "bg-slate-100 text-slate-600",
  }
  const statusClass = statusConfig[(client.status as keyof typeof statusConfig)] || "bg-slate-100 text-slate-600"

  // preferred_bhks — the column exists as int4[]
  const preferredBhks: number[] = (client as any).preferred_bhks || []

  const isTodayOrPast = client.follow_up_date && new Date(client.follow_up_date) <= new Date()

  const sourcedBrokerRelation = (client as any).broker_relations?.find((r: any) => r.relation_type === 'sourced')
  const sourcedBroker = sourcedBrokerRelation?.broker

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors group w-fit"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back to Leads
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 text-lg font-bold rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 text-purple-700 shrink-0">
              <AvatarFallback className="rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 text-purple-700 font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.full_name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("border-none rounded-full px-3 py-0.5 text-xs font-bold capitalize", statusClass)}>
                  {client.status}
                </Badge>
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full", priority.cls)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                  {priority.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                  <Clock className="w-3 h-3" />
                  {client.possession_timeline || "Flexible"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/clients/${id}/edit`}>
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </Link>
            <ClientActionsDropdown clientId={client.id} clientName={client.full_name} clientStatus={client.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column ─────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Mobile-only Quick Actions & Follow-up */}
          <div className="block lg:hidden space-y-6">
            {/* Quick Actions */}
            <SectionCard title="Quick actions" noPadding>
              <div className="flex flex-col p-2">
                <Link href={`/clients/${id}/edit`} className="w-full">
                  <button className="w-full flex items-center cursor-pointer gap-3 h-11 px-4 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors text-left">
                    <Pencil className="w-4 h-4 text-slate-400" />
                    Edit requirements
                  </button>
                </Link>
                <ClientRunMatchButton clientId={id} />

                <CRMWhatsAppButton
                  clientId={id}
                  phone={client.phone}
                  className="w-full text-emerald-600 hover:bg-emerald-50 h-11 rounded-xl text-sm justify-start px-4"
                  label="WhatsApp client"
                />

                <CRMCallButton
                  clientId={client.id}
                  phone={client.phone}
                  className="w-full text-emerald-600 hover:bg-emerald-50 h-11 rounded-xl text-sm uppercase tracking-tight"
                />
              </div>
            </SectionCard>

            {/* Follow-up */}
            <SectionCard title="Follow-up" icon={<CalendarIcon className="w-4 h-4 text-violet-500" />}>
              {client.follow_up_date ? (
                <>
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    isTodayOrPast ? "bg-red-50 border-red-100" : "bg-violet-50 border-violet-100"
                  )}>
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", isTodayOrPast ? "bg-red-100" : "bg-violet-100")}>
                      {isTodayOrPast
                        ? <AlertCircle className="w-4 h-4 text-red-600" />
                        : <CalendarIcon className="w-4 h-4 text-violet-600" />
                      }
                    </div>
                    <div>
                      <p className={cn("text-[11px] font-bold uppercase tracking-wider", isTodayOrPast ? "text-red-500" : "text-violet-500")}>
                        {isTodayOrPast ? "Overdue!" : "Scheduled"}
                      </p>
                      <div className="text-sm font-bold text-slate-900">
                        <LocalTime date={client.follow_up_date} className="text-slate-900" />
                      </div>
                      {client.follow_up_reason && (
                        <p className="text-xs text-slate-600 mt-1 font-medium">{client.follow_up_reason}</p>
                      )}
                    </div>
                  </div>
                  <QuickFollowupButton clientId={client.id} currentDate={client.follow_up_date} currentReason={client.follow_up_reason} />
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 font-medium italic">No follow-up scheduled</p>
                  <QuickFollowupButton clientId={client.id} />
                </div>
              )}
            </SectionCard>
          </div>

          {/* Contact & Personal Info */}
          <SectionCard title="Contact information" icon={<User className="w-4 h-4 text-blue-500" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow icon={<Phone className="w-4 h-4 text-emerald-500" />} label="Phone">
                <div className="flex items-center gap-2">
                  <CRMCallButton
                    clientId={client.id}
                    phone={client.phone}
                    variant="link"
                  />
                  <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, '').startsWith('91') ? client.phone.replace(/\D/g, '') : '91' + client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                    title="Chat on WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.632 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </a>
                </div>
              </InfoRow>
              <InfoRow icon={<Mail className="w-4 h-4 text-blue-500" />} label="Email">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate block">
                    {client.email}
                  </a>
                ) : <span className="text-slate-400 font-medium italic">Not provided</span>}
              </InfoRow>
              <InfoRow icon={<Tag className="w-4 h-4 text-violet-500" />} label="Lead source">
                <span className="font-bold text-slate-900">{client.source || "Unknown"}</span>
              </InfoRow>
              <InfoRow icon={<UserCheck className="w-4 h-4 text-slate-500" />} label="Assigned agent">
                {profile?.role === 'admin' ? (
                  <AssignAgentButton
                    clientId={client.id}
                    currentAssigneeId={client.assigned_to}
                    currentAssigneeName={client.assignee?.full_name}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                        {client.assignee?.full_name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-slate-900">{client.assignee?.full_name || "Unassigned"}</span>
                  </div>
                )}
              </InfoRow>
              <InfoRow icon={<Tag className="w-4 h-4 text-emerald-500" />} label="Contact Type">
                <span className="font-bold capitalize text-emerald-600">{client.contact_type || "Client"}</span>
              </InfoRow>
              <InfoRow icon={<CalendarIcon className="w-4 h-4 text-slate-400" />} label="Added">
                <span className="font-semibold text-slate-700">{formatRelativeTime(client.created_at)}</span>
              </InfoRow>
              <InfoRow icon={<CalendarIcon className="w-4 h-4 text-slate-400" />} label="Last updated">
                <span className="font-semibold text-slate-700">{formatRelativeTime(client.updated_at)}</span>
              </InfoRow>
            </div>

            {client.notes && (
              <div className="mt-5 pt-5 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </SectionCard>

          {/* Broker Source Info */}
          {sourcedBroker && (
            <Card className="bg-indigo-50 border-none rounded-[1.5rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                <Handshake className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sourced from Broker</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                  <h3 className="text-xl font-bold text-slate-900">{sourcedBroker.full_name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    {sourcedBroker.phones?.[0] || "No phone"}
                  </div>
                </div>
              </div>
              <Link href={`/brokers/${sourcedBroker.id}`}>
                <Button className="h-11 px-4 cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2">
                  View Broker
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Property Requirements */}
          <SectionCard title="Property requirements" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>
            {/* Intent row */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm text-lg shrink-0">
                {client.looking_for === "rent" ? "🔑" : client.looking_for === "sell" ? "🏷️" : client.looking_for === "lease" ? "📄" : client.looking_for === "rent_owner" ? "👑" : "🏠"}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Intent</p>
                <p className="text-sm font-bold text-slate-900 capitalize">
                  {client.looking_for === "rent" ? "Tenant" : client.looking_for === "sell" ? "Selling" : client.looking_for === "lease" ? "Leasing" : client.looking_for === "rent_owner" ? "Rent Owner" : "Buying"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ReqCard icon={<Home className="w-4 h-4 text-blue-500" />} label="Property types">
                {client.property_types?.length ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.property_types.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold capitalize">
                        {t.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-sm font-bold text-slate-700 mt-1">Any</span>}
              </ReqCard>

              <ReqCard icon={<MapPin className="w-4 h-4 text-emerald-500" />} label="Preferred locations">
                {client.preferred_locations?.length ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.preferred_locations.map((l: string) => (
                      <span key={l} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold">
                        {l}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-sm font-bold text-slate-700 mt-1">Any</span>}
              </ReqCard>

              <ReqCard icon={<IndianRupee className="w-4 h-4 text-emerald-500" />} label="Budget">
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {formatBudgetRange(client.budget_min, client.budget_max)}
                </span>
              </ReqCard>

              <ReqCard icon={<BedDouble className="w-4 h-4 text-violet-500" />} label="Preferred BHK">
                {preferredBhks.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preferredBhks.sort((a, b) => a - b).map((bhk: number) => (
                      <span key={bhk} className="w-8 h-7 bg-violet-50 text-violet-700 rounded-lg text-[11px] font-bold flex items-center justify-center">
                        {bhk === 5 ? "5+" : bhk}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-400 font-medium self-center">BHK</span>
                  </div>
                ) : <span className="text-sm font-bold text-slate-700 mt-1">Any</span>}
              </ReqCard>

              <ReqCard icon={<BedDouble className="w-4 h-4 text-slate-400" />} label="Min bedrooms">
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {!client.min_bedrooms || client.min_bedrooms === 0 ? "Any" : client.min_bedrooms === 5 ? "5+" : `${client.min_bedrooms}+`}
                </span>
              </ReqCard>

              <ReqCard icon={<Ruler className="w-4 h-4 text-slate-400" />} label="Min area">
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {client.min_area_sqft ? `${client.min_area_sqft.toLocaleString()} ${
                    {
                      sqft: "sq. ft",
                      sqyard: "sq. yard",
                      sqm: "sq. meter",
                      gaj: "gaj",
                      bigha: "bigha"
                    }[client.min_area_unit || 'sqft'] || 'sq. ft'
                  }` : "Any"}
                </span>
              </ReqCard>

              <ReqCard icon={<Sofa className="w-4 h-4 text-slate-400" />} label="Furnishing">
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {client.furnishing_preference || "Any"}
                </span>
              </ReqCard>

              <ReqCard icon={<Clock className="w-4 h-4 text-slate-400" />} label="Timeline">
                <span className="text-sm font-bold text-slate-900 mt-1">
                  {client.possession_timeline || "Flexible"}
                </span>
              </ReqCard>
            </div>


          </SectionCard>

          {/* Properties to Sell / Rent Out — temporarily hidden per request
          {(client.looking_for === "sell" || client.looking_for === "rent_owner") && (
            <SectionCard
              title="Listed Properties"
              icon={<Home className="w-4 h-4 text-amber-500" />}
              badge={String(propertyLinks.length)}
            >
              <ClientSellPropertiesSection
                clientId={client.id}
                clientName={client.full_name}
                initialLinks={propertyLinks as any}
              />
            </SectionCard>
          )}
          */}

          {/* Shown Properties History */}
          {(client.looking_for !== "sell" && client.looking_for !== "rent_owner") && <ShownPropertiesSection clientId={client.id} />}

          {/* Lead & Marketing Metadata */}
          {(client.lead_score !== null || client.utm_source || client.utm_campaign || client.page_enquired || client.preferred_call_time || client.purpose) && (
            <SectionCard title="Lead Acquisition Context" icon={<ExternalLink className="w-4 h-4 text-pink-500" />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {client.lead_score !== null && client.lead_score > 0 && (
                  <ReqCard icon={<span className="text-sm">🔥</span>} label="Lead Score">
                    <span className="text-sm font-bold text-slate-900 mt-1">{client.lead_score}</span>
                  </ReqCard>
                )}
                {client.preferred_call_time && (
                  <ReqCard icon={<Clock className="w-4 h-4 text-blue-500" />} label="Preferred Time">
                    <span className="text-sm font-bold text-slate-900 mt-1">{client.preferred_call_time}</span>
                  </ReqCard>
                )}
                {client.ready_for_site_visit && (
                  <ReqCard icon={<MapPin className="w-4 h-4 text-emerald-500" />} label="Site Visit">
                    <span className="text-sm font-bold text-slate-900 mt-1 capitalize">{client.ready_for_site_visit}</span>
                  </ReqCard>
                )}
                {client.purpose && (
                  <ReqCard icon={<Building2 className="w-4 h-4 text-violet-500" />} label="Purpose">
                    <span className="text-sm font-bold text-slate-900 mt-1 capitalize">{client.purpose}</span>
                  </ReqCard>
                )}
                {client.page_enquired && (
                  <ReqCard icon={<ExternalLink className="w-4 h-4 text-slate-400" />} label="Enquiry Page">
                    <span className="text-sm font-bold text-slate-900 mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap block" title={client.page_enquired}>
                      {client.page_enquired}
                    </span>
                  </ReqCard>
                )}
                {(client.utm_source || client.utm_campaign || client.campaign_name) && (
                  <ReqCard icon={<span className="text-sm">📢</span>} label="Marketing Source">
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-sm font-bold text-slate-900">{client.campaign_name || client.utm_campaign || client.utm_source}</span>
                      {client.utm_medium && <span className="text-[11px] text-slate-500 font-medium">via {client.utm_medium}</span>}
                    </div>
                  </ReqCard>
                )}
              </div>
            </SectionCard>
          )}

          {/* Interaction History (Calls, Meetings, Updates) */}
          <SectionCard title="Interaction History" icon={<HistoryIcon className="w-4 h-4 text-emerald-500" />}>
            <InteractionHistory clientId={client.id} />
          </SectionCard>
        </div>

        {/* ── Right Column ──────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Interaction Logger (Log Call/Update) */}
          <InteractionLogger clientId={client.id} hasPendingFollowUp={!!client.follow_up_date} />

          {/* Desktop-only Follow-up & Quick Actions */}
          <div className="hidden lg:block space-y-6">
            {/* Follow-up */}
            <SectionCard title="Follow-up" icon={<CalendarIcon className="w-4 h-4 text-violet-500" />}>
              {client.follow_up_date ? (
                <>
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    isTodayOrPast ? "bg-red-50 border-red-100" : "bg-violet-50 border-violet-100"
                  )}>
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", isTodayOrPast ? "bg-red-100" : "bg-violet-100")}>
                      {isTodayOrPast
                        ? <AlertCircle className="w-4 h-4 text-red-600" />
                        : <CalendarIcon className="w-4 h-4 text-violet-600" />
                      }
                    </div>
                    <div>
                      <p className={cn("text-[11px] font-bold uppercase tracking-wider", isTodayOrPast ? "text-red-500" : "text-violet-500")}>
                        {isTodayOrPast ? "Overdue!" : "Scheduled"}
                      </p>
                      <div className="text-sm font-bold text-slate-900">
                        <LocalTime date={client.follow_up_date} className="text-slate-900" />
                      </div>
                      {client.follow_up_reason && (
                        <p className="text-xs text-slate-600 mt-1 font-medium">{client.follow_up_reason}</p>
                      )}
                    </div>
                  </div>
                  <QuickFollowupButton clientId={client.id} currentDate={client.follow_up_date} currentReason={client.follow_up_reason} />
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 font-medium italic">No follow-up scheduled</p>
                  <QuickFollowupButton clientId={client.id} />
                </div>
              )}
            </SectionCard>
            {/* Quick Actions */}
            <SectionCard title="Quick actions" noPadding>
              <div className="flex flex-col p-2">
                <Link href={`/clients/${id}/edit`} className="w-full">
                  <button className="w-full flex items-center cursor-pointer gap-3 h-11 px-4 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors text-left">
                    <Pencil className="w-4 h-4 text-slate-400" />
                    Edit requirements
                  </button>
                </Link>
                <ClientRunMatchButton clientId={id} />

                <CRMWhatsAppButton
                  clientId={id}
                  phone={client.phone}
                  className="w-full text-emerald-600 hover:bg-emerald-50 h-11 rounded-xl text-sm justify-start px-4"
                  label="WhatsApp client"
                />

                <CRMCallButton
                  clientId={client.id}
                  phone={client.phone}
                  className="w-full text-emerald-600 hover:bg-emerald-50 h-11 rounded-xl text-sm uppercase tracking-tight"
                />
              </div>
            </SectionCard>
          </div>

          {/* Matched Properties */}
          <SectionCard
            title="Matched properties"
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            badge={String(clientMatches.length)}
          >
            {clientMatches.length > 0 ? (
              <div className="space-y-3">
                {clientMatches.slice(0, 5).map((match: any) => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{match.property?.title}</p>
                        <p className="text-[10px] text-slate-500">{[match.property?.locality, match.property?.city].filter(Boolean).join(', ')}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                match.score >= 80 ? "bg-emerald-500" : match.score >= 60 ? "bg-amber-400" : "bg-slate-400"
                              )}
                              style={{ width: `${match.score}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-[10px] font-black shrink-0",
                            match.score >= 80 ? "text-emerald-600" : match.score >= 60 ? "text-amber-600" : "text-slate-500"
                          )}>{match.score}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {clientMatches.length > 5 && (
                  <Link href={`/matches?search=${encodeURIComponent(client.full_name)}`}>
                    <p className="text-xs font-bold text-emerald-600 text-center pt-1 hover:underline">
                      View all {clientMatches.length} matches →
                    </p>
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-700">No matches yet</p>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-[180px]">Run the smart match engine to find properties</p>
              </div>
            )}
          </SectionCard>

          {/* Marketing & Context */}
          {(client.utm_source || client.campaign_name || client.lead_score || client.purpose) && (
            <SectionCard title="Marketing & Context" icon={<Globe className="w-4 h-4 text-orange-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {client.purpose && (
                  <InfoRow icon={<Home className="w-4 h-4 text-slate-500" />} label="Purpose">
                    <span className="font-bold text-slate-900">{client.purpose}</span>
                  </InfoRow>
                )}
                {client.ready_for_site_visit && (
                  <InfoRow icon={<MapPin className="w-4 h-4 text-emerald-500" />} label="Site Visit Readiness">
                    <span className="font-bold text-emerald-700">{client.ready_for_site_visit}</span>
                  </InfoRow>
                )}
                {client.preferred_call_time && (
                  <InfoRow icon={<Phone className="w-4 h-4 text-blue-500" />} label="Preferred Call Time">
                    <span className="font-bold text-slate-900">{client.preferred_call_time}</span>
                  </InfoRow>
                )}
                {client.utm_source && (
                  <InfoRow icon={<Tag className="w-4 h-4 text-indigo-500" />} label="UTM Source">
                    <span className="font-bold text-slate-900">{client.utm_source}</span>
                  </InfoRow>
                )}
                {client.campaign_name && (
                  <InfoRow icon={<TrendingUp className="w-4 h-4 text-orange-500" />} label="Campaign">
                    <span className="font-bold text-slate-900">{client.campaign_name}</span>
                  </InfoRow>
                )}
                {client.lead_score && client.lead_score > 0 ? (
                  <InfoRow icon={<Sparkles className="w-4 h-4 text-amber-500" />} label="Lead Score">
                    <span className="font-bold text-amber-600">{client.lead_score} / 100</span>
                  </InfoRow>
                ) : null}
              </div>
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, children, badge, noPadding }: {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  badge?: string
  noPadding?: boolean
}) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>}
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          </div>
          {badge !== undefined && (
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">{badge}</span>
          )}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>
        {children}
      </div>
    </Card>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

function ReqCard({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
      </div>
      {children}
    </div>
  )
}
