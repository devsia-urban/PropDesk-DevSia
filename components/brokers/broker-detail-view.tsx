'use client'

import React from "react"
import {
  Phone,
  Mail,
  MapPin,
  Star,
  Building,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Handshake,
  Tag,
  PlusCircle,
  Share2,
  Users,
  UserPlus
} from "lucide-react"
import { LinkPropertyModal } from "@/components/brokers/link-property-modal"
import { LinkClientModal } from "@/components/brokers/link-client-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Broker, BrokerPropertyRelation, BrokerClientRelation } from "@/lib/types/database"
import { PropertyCard } from "@/components/properties/property-card"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { deleteBroker } from "@/lib/actions/brokers"
import { toast } from "sonner"

interface BrokerDetailViewProps {
  broker: Broker & {
    relations: (BrokerPropertyRelation & { property: any })[],
    client_relations: (BrokerClientRelation & { client: any })[]
  }
}

export function BrokerDetailView({ broker }: BrokerDetailViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("sourced")
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false)
  const [isLinkClientModalOpen, setIsLinkClientModalOpen] = React.useState(false)
  const primaryPhone = broker.phones?.[0] || ""

  const whatsappUrl = primaryPhone
    ? `https://wa.me/${primaryPhone.replace(/\D/g, '')}`
    : null

  const sourcedProperties = (broker.relations || [])
    .filter(r => r.relation_type === 'sourced' && r.property)
    .map(r => r.property)

  const sharedProperties = (broker.relations || [])
    .filter(r => r.relation_type === 'shared' && r.property)
    .map(r => r.property)

  const sourcedClients = (broker.client_relations || [])
    .filter(r => r.relation_type === 'sourced' && r.client)
    .map(r => r.client)

  const sharedClients = (broker.client_relations || [])
    .filter(r => r.relation_type === 'shared' && r.client)
    .map(r => r.client)

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this broker? This action cannot be undone.")) {
      const result = await deleteBroker(broker.id)
      if (result.success) {
        toast.success("Broker deleted successfully")
        router.push("/brokers")
      } else {
        toast.error(result.error || "Failed to delete broker")
      }
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-[1rem] border border-slate-200 p-4 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-start">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center shrink-0 shadow-xl shadow-slate-200">
            <Handshake className="w-10 h-10 text-white" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{broker.full_name}</h1>
                  <Badge className="bg-amber-100 text-amber-700 border-none font-black px-3 py-1 rounded-lg">
                    {broker.broker_type === 'freelance' ? 'Independent' :
                      broker.broker_type === 'agency' ? 'Agency' : 'Collaborator'}
                  </Badge>
                </div>
                {broker.company_name && (
                  <p className="text-lg font-bold text-slate-400 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {broker.company_name}
                  </p>
                )}
              </div>

              <div className="flex items-center  gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="icon" className="h-12 w-12 cursor-pointer rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </Button>
                  } />
                  <DropdownMenuContent className="bg-white font-bold p-2 rounded-2xl border-slate-100 shadow-xl">
                    <DropdownMenuItem
                      onClick={() => router.push(`/brokers/${broker.id}/edit`)}
                      className="flex items-center gap-2 p-3 cursor-pointer rounded-xl hover:bg-slate-50 text-slate-600"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="flex items-center gap-2 p-3 cursor-pointer rounded-xl hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Broker
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center max-sm:flex-col gap-2">
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="h-12 px-6 cursor-pointer rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 gap-2">
                        <MessageSquare className="w-5 h-5" />
                        WhatsApp
                      </Button>
                    </a>
                  )}

                  {primaryPhone && (
                    <a href={`tel:${primaryPhone}`}>
                      <Button className="h-12 px-6 cursor-pointer rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 gap-2">
                        <Phone className="w-5 h-5" />
                        Call Agent
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Area</p>
                  <p className="font-bold text-sm">{broker.area || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Reliability</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-3.5 h-3.5", i < broker.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Partner Since</p>
                  <p className="font-bold text-sm">{new Date(broker.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Tags */}
      <div className="flex flex-wrap gap-2">
        {broker.specialties?.map(specialty => (
          <Badge key={specialty} className="bg-white border-2 border-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-bold flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            {specialty}
          </Badge>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => router.push(`/properties/new?source_broker_id=${broker.id}&contact_type=broker&seller_name=${encodeURIComponent(broker.full_name)}&seller_phone=${encodeURIComponent(primaryPhone)}`)}
          className="h-16 cursor-pointer rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          Sourced Prop
        </Button>
        <Button
          onClick={() => setIsLinkModalOpen(true)}
          className="h-16 cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <Share2 className="w-5 h-5 shrink-0" />
          Shared Prop
        </Button>
        <Button
          onClick={() => router.push(`/clients/new?source_broker_id=${broker.id}&contact_type=broker`)}
          className="h-16 cursor-pointer rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5 shrink-0" />
          Sourced Client
        </Button>
        <Button
          onClick={() => setIsLinkClientModalOpen(true)}
          className="h-16 cursor-pointer rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          <Users className="w-5 h-5 shrink-0" />
          Shared Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-none rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <ArrowDownLeft className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-900 leading-none mb-1">{sourcedProperties.length}</p>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Props Sourced</p>
          </div>
        </Card>

        <Card className="bg-emerald-50 border-none rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <ArrowUpRight className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-900 leading-none mb-1">{sharedProperties.length}</p>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Props Shared</p>
          </div>
        </Card>

        <Card className="bg-indigo-50 border-none rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-900 leading-none mb-1">{sourcedClients.length}</p>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clients Sourced</p>
          </div>
        </Card>

        <Card className="bg-slate-50 border-none rounded-[1.5rem] p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{sharedClients.length}</p>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Clients Shared</p>
          </div>
        </Card>
      </div>

      {/* History Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6 sm:space-y-8">
        {/* TABS NAVIGATION - Highly Responsive Scrolling on Mobile */}
        <div className="relative w-full rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar snap-x snap-mandatory gap-1 sm:gap-2 justify-start md:justify-center bg-transparent h-auto p-0">

            <TabsTrigger
              value="sourced"
              className={cn(
                "snap-center whitespace-nowrap flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer rounded-xl font-semibold transition-all flex items-center gap-2",
                activeTab === "sourced"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Prop Sourced</span>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", activeTab === "sourced" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                {sourcedProperties.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="shared"
              className={cn(
                "snap-center whitespace-nowrap flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer rounded-xl font-semibold transition-all flex items-center gap-2",
                activeTab === "shared"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              )}
            >
              <Share2 className="w-4 h-4" />
              <span>Prop Shared</span>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", activeTab === "shared" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                {sharedProperties.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="clients-sourced"
              className={cn(
                "snap-center whitespace-nowrap flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer rounded-xl font-semibold transition-all flex items-center gap-2",
                activeTab === "clients-sourced"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              )}
            >
              <UserPlus className="w-4 h-4" />
              <span>Client Sourced</span>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", activeTab === "clients-sourced" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700")}>
                {sourcedClients.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="clients-shared"
              className={cn(
                "snap-center whitespace-nowrap flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer rounded-xl font-semibold transition-all flex items-center gap-2",
                activeTab === "clients-shared"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              )}
            >
              <Users className="w-4 h-4" />
              <span>Client Shared</span>
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", activeTab === "clients-shared" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                {sharedClients.length}
              </span>
            </TabsTrigger>

          </TabsList>
        </div>

        {/* TAB CONTENTS */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* SOURCED PROPERTIES */}
          <TabsContent value="sourced" className="mt-0 outline-none">
            {sourcedProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {sourcedProperties.map((p: any) => (
                  <PropertyCard key={p.id} property={p} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-linear-to-b from-slate-50/80 to-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-slate-100 ring-4 ring-slate-50">
                  <Building className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Sourcing History</h3>
                <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  Properties sourced from this agent will appear here as inventory.
                </p>
              </div>
            )}
          </TabsContent>

          {/* SHARED PROPERTIES */}
          <TabsContent value="shared" className="mt-0 outline-none">
            {sharedProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {sharedProperties.map((p: any) => (
                  <PropertyCard key={p.id} property={p} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-linear-to-b from-slate-50/80 to-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-slate-100 ring-4 ring-slate-50">
                  <ArrowUpRight className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Sharing History</h3>
                <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  Track properties you have shared with this agent for their clients.
                </p>
              </div>
            )}
          </TabsContent>

          {/* CLIENTS SOURCED */}
          <TabsContent value="clients-sourced" className="mt-0 outline-none">
            {sourcedClients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {sourcedClients.map((c: any) => (
                  <Card key={c.id} className="group relative overflow-hidden p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 line-clamp-1">{c.full_name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1">
                            {c.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                      <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-400" /> {c.phone}</p>
                      <p className="flex items-center gap-2.5"><Building className="w-4 h-4 text-slate-400" /> {c.budget_max ? `₹${c.budget_max.toLocaleString()}` : "Budget N/A"}</p>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => router.push(`/clients/${c.id}`)}
                      className="w-full mt-4 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-linear-to-b from-indigo-50/50 to-slate-50/80 rounded-3xl border-2 border-dashed border-indigo-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-indigo-50 ring-4 ring-indigo-50/50">
                  <UserPlus className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Clients Sourced</h3>
                <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  Clients referred to you by this agent will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* CLIENTS SHARED */}
          <TabsContent value="clients-shared" className="mt-0 outline-none">
            {sharedClients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {sharedClients.map((c: any) => (
                  <Card key={c.id} className="group relative overflow-hidden p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 line-clamp-1">{c.full_name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1">
                            {c.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                      <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-400" /> {c.phone}</p>
                      <p className="flex items-center gap-2.5"><Building className="w-4 h-4 text-slate-400" /> {c.budget_max ? `₹${c.budget_max.toLocaleString()}` : "Budget N/A"}</p>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => router.push(`/clients/${c.id}`)}
                      className="w-full mt-4 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-linear-to-b from-slate-50/80 to-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-slate-100 ring-4 ring-slate-50">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Clients Shared</h3>
                <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  Leads you have shared with this agent will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Internal Notes */}
      {broker.notes && (
        <div className="bg-white rounded-[1rem] border border-slate-200 p-8">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Relationship Notes
          </h2>
          <div className="p-6 bg-slate-50 rounded-[1rem] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
            {broker.notes}
          </div>
        </div>
      )}

      <LinkPropertyModal
        brokerId={broker.id}
        brokerName={broker.full_name}
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
      />

      <LinkClientModal
        brokerId={broker.id}
        brokerName={broker.full_name}
        isOpen={isLinkClientModalOpen}
        onClose={() => setIsLinkClientModalOpen(false)}
      />
    </div>
  )
}
