export const dynamic = "force-dynamic";
import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Sparkles,
  MoreVertical,
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  TriangleAlert,
  Phone,
  Mail,
  CheckCheck,
  X,
  Copy,
  Link2Icon,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getMatch } from "@/lib/actions/matches"
import { formatBudget, formatRelativeTime } from "@/lib/utils/format"
import { MatchDetailActions } from "@/components/matches/match-detail-actions"
import { PropertyShareActions } from "@/components/properties/property-share-actions"
import { getDefaultWhatsAppTemplate } from "@/lib/actions/templates"

interface Props {
  params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params
  const match = await getMatch(id)

  if (!match) notFound()

  const client = match.client
  const property = match.property
  const breakdown = match.score_breakdown as any

  const isLandOrCommercial = ['plot', 'farmer_land', 'commercial', 'shop', 'office', 'showroom', 'commercial_land'].includes(property?.property_type || '')
  const bhkMax = isLandOrCommercial ? 0 : 15
  const areaMax = isLandOrCommercial ? 20 : 5

  const comparisonRows = [
    {
      label: "Property Type",
      client: client?.property_types?.join(', ') || 'Any',
      property: property?.property_type || '—',
      isMatch: breakdown?.property_type >= 10,
      points: breakdown?.property_type,
      max: 40
    },
    {
      label: "Listing Type",
      client: client?.looking_for === 'buy' ? 'Buy' : (client?.looking_for === 'rent' || client?.looking_for === 'rent_owner' || client?.looking_for === 'lease') ? 'Rent/Lease' : 'Sell',
      property: property?.listing_type === 'sale' ? 'Sale' : 'Rent',
      isMatch: ((client?.looking_for === 'buy' || client?.looking_for === 'sell') && property?.listing_type === 'sale') || ((client?.looking_for === 'rent' || client?.looking_for === 'rent_owner' || client?.looking_for === 'lease') && (property?.listing_type === 'rent' || property?.listing_type === 'lease')),
      points: null,
      max: null
    },
    {
      label: "Budget / Price",
      client: client?.budget_max ? `Max ${formatBudget(client.budget_max)}` : 'No Limit',
      property: property?.price ? formatBudget(property.price) : '—',
      isMatch: breakdown?.budget >= 15,
      points: breakdown?.budget,
      max: 30
    },
    {
      label: "BHK / Config",
      client: client?.preferred_bhks?.length ? `${client.preferred_bhks.join(', ')} BHK` : (client?.min_bedrooms ? `${client.min_bedrooms}+ BHK` : 'Any'),
      property: property?.bhk ? `${property.bhk} BHK` : '—',
      isMatch: breakdown?.bedrooms >= (isLandOrCommercial ? 0 : 10),
      points: breakdown?.bedrooms,
      max: bhkMax
    },
    {
      label: "Area (Sq Ft)",
      client: client?.min_area_sqft ? `${client.min_area_sqft.toLocaleString()}+` : 'Any',
      property: property?.area_sqft ? property.area_sqft.toLocaleString() : '—',
      isMatch: breakdown?.area >= (isLandOrCommercial ? 10 : 2),
      points: breakdown?.area,
      max: areaMax
    },
    {
      label: "Location",
      client: client?.preferred_locations?.length ? client.preferred_locations.join(', ') : 'Any',
      property: `${property?.locality || ''}, ${property?.city || ''}`,
      isMatch: breakdown?.location >= 10,
      points: breakdown?.location,
      max: 10
    }
  ]

  // Helper for rendering match icons
  const renderMatchIcon = (isMatch: boolean, max: number | null) => {
    if (max === 0) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 italic text-[10px] text-slate-400">
          N/A
        </div>
      )
    }
    return isMatch ? (
      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-100/50">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      </div>
    ) : (
      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm shadow-red-100/50">
        <X className="w-4 h-4 text-red-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 px-4 sm:px-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-4">
          <Link href="/matches" className="inline-flex items-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to matches
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Match Intelligence</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-full shadow-sm">
                Smart Match
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-slate-500 font-medium tracking-tight">Detailed side-by-side comparison analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto w-full md:w-auto justify-between md:justify-start">
          <PropertyShareActions 
            propertyId={property?.id || ""} 
            propertyTitle={property?.title || ""} 
            propertySlug={property?.slug || undefined}
            agencyName={"Your Agency"} // Will be handled by the component's default if not passed, but we can pass branding here
            clientName={client?.full_name}
            propertyType={property?.property_type}
            locality={property?.locality || property?.city || undefined}
            price={property?.price}
            whatsappTemplate={await getDefaultWhatsAppTemplate()}
          />
          <div className="flex flex-col items-start md:items-end px-2 md:px-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Overall Match</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{match.score}%</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden md:block" />
          <MatchDetailActions matchId={match.id} currentStatus={match.status} />
        </div>
      </header>

      {/* Main Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 bg-white lg:bg-transparent rounded-3xl lg:rounded-none shadow-xl lg:shadow-none border border-slate-100 lg:border-none overflow-hidden">

        {/* Comparison Table (Left 8 cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 lg:p-8 lg:bg-white lg:rounded-[2.5rem] lg:shadow-2xl lg:shadow-slate-200/50 lg:border lg:border-white space-y-4 md:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-500" />
              Side-by-Side Comparison
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Score: {match.score} / 100
            </span>
          </div>

          <div className="space-y-3">
            {/* Table Header (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 rounded-xl">
              <div className="col-span-3 text-[11px] font-black text-slate-500 uppercase tracking-widest pl-2">Feature</div>
              <div className="col-span-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Client Demands</div>
              <div className="col-span-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Property Offers</div>
              <div className="col-span-1 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Match</div>
            </div>

            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 md:py-3 md:px-4 rounded-2xl md:hover:bg-slate-50/50 transition-all border border-slate-100 md:border-transparent md:hover:border-slate-100 group bg-slate-50/30 md:bg-transparent">
                {/* Mobile Header per row / Desktop Col 1 */}
                <div className="md:col-span-3 flex justify-between items-center md:items-start md:flex-col border-b border-slate-200/60 md:border-none pb-2 md:pb-0">
                  <span className="text-xs md:text-[11px] font-black text-slate-600 uppercase tracking-tight flex flex-col md:pl-2">
                    {row.label}
                    {row.max && (
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">({row.points}/{row.max} pts)</span>
                    )}
                  </span>
                  {/* Mobile Match Icon */}
                  <div className="md:hidden">
                    {renderMatchIcon(row.isMatch, row.max)}
                  </div>
                </div>

                {/* Client Cell */}
                <div className="md:col-span-4 flex md:block justify-between items-center mt-1 md:mt-0">
                  <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Demands</span>
                  <span className="text-sm font-bold text-slate-600 capitalize break-words text-right md:text-left">{row.client}</span>
                </div>

                {/* Property Cell */}
                <div className="md:col-span-4 flex md:block justify-between items-center">
                  <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Offers</span>
                  <span className="text-sm font-bold text-slate-900 capitalize break-words text-right md:text-left">{row.property}</span>
                </div>

                {/* Desktop Match Icon */}
                <div className="hidden md:flex col-span-1 justify-center items-center">
                  {renderMatchIcon(row.isMatch, row.max)}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats / Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Confidence Rating</h4>
              <p className="text-lg font-black text-emerald-800 tracking-tight">
                {match.score >= 80 ? 'High Confidence' : match.score >= 50 ? 'Strong Potential' : 'Review Required'}
              </p>
              <p className="text-xs font-medium text-emerald-700/70 mt-1 italic">Based on {comparisonRows.length} weighted parameters</p>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Smart Engine Note</h4>
              <div className="space-y-1.5">
                {breakdown.notes && breakdown.notes.length > 0 ? (
                  breakdown.notes.map((note: string, idx: number) => (
                    <p key={idx} className="text-sm font-bold text-indigo-800 leading-snug flex items-start gap-2">
                       <span className="w-1 h-1 rounded-full bg-indigo-400 mt-2 shrink-0" />
                       {note}
                    </p>
                  ))
                ) : (
                  <p className="text-sm font-bold text-indigo-800 leading-snug">
                    Matches {property?.property_type} in {property?.city} with {client?.full_name}'s {client?.looking_for} requirements.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summaries (Right 4 cols) */}
        <div className="lg:col-span-4 lg:bg-slate-50 lg:rounded-[2.5rem] border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col divide-y divide-slate-200/60 lg:shadow-inner">

          {/* Client Summary */}
          <div className="p-6 lg:p-8 space-y-6 bg-slate-50/50 lg:bg-transparent">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-full shadow-md ring-4 ring-white border-2 border-indigo-100">
                <AvatarFallback className="bg-indigo-500 text-white text-lg font-black">
                  {client?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{client?.full_name}</h3>
                <Link href={`/clients/${client?.id}`} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1">
                  View full profile
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-xs font-bold text-slate-700 truncate">{client?.email || 'N/A'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-xs font-bold text-slate-700 truncate">{client?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Property Summary */}
          <div className="p-6 lg:p-8 flex-1 flex flex-col justify-between bg-white lg:bg-transparent rounded-b-3xl lg:rounded-none">
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg ring-4 ring-white border border-slate-100 relative group">
                {property?.cover_image_url ? (
                  <img src={property.cover_image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-slate-900/90 backdrop-blur-md text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-full">
                    {property?.status || 'Available'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PropertyShareActions 
                    propertyId={property.id} 
                    propertyTitle={property.title} 
                    propertySlug={property.slug || undefined}
                    propertyType={property.property_type}
                    locality={property.locality || property.city || undefined}
                    price={property.price}
                    whatsappTemplate={await getDefaultWhatsAppTemplate()}
                  />
                  <h3 className="text-2xl font-black font-sans text-slate-900 tracking-tight leading-none">{property?.price ? formatBudget(property.price) : '—'}</h3>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold rounded-lg text-xs pointer-events-none border border-blue-100">
                    {property?.property_type}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-slate-600 leading-relaxed line-clamp-2">{property?.title}</p>
                <div className="flex items-center text-slate-500 font-bold text-[11px] uppercase tracking-tight">
                  <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                  {property?.locality}, {property?.city}
                </div>
                <Link href={`/properties/${property?.id}`} className="mt-6 block">
                  <Button variant="outline" className="w-full h-12 cursor-pointer rounded-xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all gap-2">
                    View Property
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-slate-900/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000" />
        <div className="relative space-y-2 text-center md:text-left">
          <h4 className="text-xl sm:text-2xl font-black tracking-tight">Ready to close this deal?</h4>
          <p className="text-slate-400 font-medium text-sm">Suggested actions based on {match.status} status</p>
        </div>

        <div className="relative w-full md:w-auto flex justify-center md:justify-end">
          <MatchDetailActions matchId={match.id} currentStatus={match.status} footer />
        </div>
      </footer>
    </div>
  )
}