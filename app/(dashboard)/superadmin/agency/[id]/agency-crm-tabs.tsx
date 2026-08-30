'use client'

import React, { useState } from "react"
import { 
  Building2, 
  Users, 
  Layers, 
  MessageSquare, 
  CreditCard, 
  Activity,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Clock
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InviteButtons } from "@/components/admin/invite-buttons"
import { updateAgencySubscription } from "@/lib/actions/admin"
import { addDays } from "date-fns"
import { cn } from "@/lib/utils"

export function AgencyCRMTabs({ agency }: { agency: any }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'billing'>('overview')
  const [isUpdating, setIsUpdating] = useState(false)

  const propertiesCount = agency.properties?.[0]?.count || 0
  const clientsCount = agency.clients?.[0]?.count || 0
  const schemesCount = agency.schemes?.[0]?.count || 0
  const membersCount = agency.profiles?.[0]?.count || 0

  const handleUpdateSubscription = async (status: 'trial' | 'active' | 'paused' | 'expired', daysToAdd?: number) => {
    setIsUpdating(true)
    try {
      let nextDate = agency.subscription_end_date
      if (daysToAdd) {
        const baseDate = agency.subscription_end_date ? new Date(agency.subscription_end_date) : new Date()
        nextDate = addDays(baseDate, daysToAdd).toISOString()
      }
      
      const payload: any = { subscription_status: status }
      if (daysToAdd) payload.subscription_end_date = nextDate
      if (status === 'active' && daysToAdd === 30) payload.plan_type = 'monthly'

      await updateAgencySubscription(agency.id, payload)
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-2xl">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", activeTab === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
        >
          Overview & Metrics
        </button>
        <button 
          onClick={() => setActiveTab('crm')}
          className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", activeTab === 'crm' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
        >
          CRM & Support
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", activeTab === 'billing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}
        >
          Billing & Access
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white p-6 rounded-[2rem] border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-medium mb-3">
                <Users className="w-5 h-5 text-blue-500" /> Members
              </div>
              <div className="text-4xl font-black text-slate-900">{membersCount}</div>
            </Card>
            <Card className="bg-white p-6 rounded-[2rem] border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-medium mb-3">
                <Building2 className="w-5 h-5 text-emerald-500" /> Properties
              </div>
              <div className="text-4xl font-black text-slate-900">{propertiesCount}</div>
            </Card>
            <Card className="bg-white p-6 rounded-[2rem] border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-medium mb-3">
                <Users className="w-5 h-5 text-purple-500" /> Leads
              </div>
              <div className="text-4xl font-black text-slate-900">{clientsCount}</div>
            </Card>
            <Card className="bg-white p-6 rounded-[2rem] border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 font-medium mb-3">
                <Layers className="w-5 h-5 text-amber-500" /> Townships
              </div>
              <div className="text-4xl font-black text-slate-900">{schemesCount}</div>
            </Card>
          </div>

          <Card className="bg-white border-slate-100 p-8 rounded-[2rem] shadow-sm max-w-3xl">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Platform Engagement
            </h3>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 text-amber-800">
              <AlertCircle className="w-6 h-6 shrink-0 text-amber-500" />
              <div>
                <h4 className="font-bold mb-1">Activity Tracking Paused</h4>
                <p className="text-sm">Granular activity metrics (Logins, properties added this week, API usage) will be populated here once the internal telemetry engine is enabled in the upcoming Database Phase.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CRM Tab */}
      {activeTab === 'crm' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl">
          <Card className="bg-white border-slate-100 p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" /> Sales & Follow-ups
              </h3>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">
                + Add CRM Note
              </Button>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-slate-900 font-bold text-lg mb-1">No Notes Recorded</h4>
                <p className="text-slate-500 font-medium text-sm">
                  The robust notes and tracking system will be activated when the database schema is updated in the Payment Integration Phase.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-8 rounded-[2rem] shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Support Queries
            </h3>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center space-y-2">
              <div className="text-slate-500 font-medium text-sm">
                No active support tickets from this agency.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <Card className="bg-white border-slate-100 p-8 rounded-[2rem] shadow-sm space-y-8">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> Subscription Status
            </h3>

            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium text-sm">Current Status</div>
                  <Badge className={cn(
                    "uppercase font-black tracking-widest px-3 py-1",
                    agency.subscription_status === 'trial' && "bg-amber-100 text-amber-700",
                    agency.subscription_status === 'active' && "bg-emerald-100 text-emerald-700",
                    agency.subscription_status === 'paused' && "bg-slate-900 text-white",
                    agency.subscription_status === 'expired' && "bg-red-100 text-red-700"
                  )}>
                    {agency.subscription_status}
                  </Badge>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-slate-500 font-medium text-sm">Valid Until</div>
                  <div className="font-black text-slate-900 text-lg">
                    {agency.subscription_end_date ? new Date(agency.subscription_end_date).toLocaleDateString('en-GB') : 'Lifetime'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Modify Access</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                    onClick={() => handleUpdateSubscription('trial', 7)}
                    disabled={isUpdating}
                    variant="outline" 
                    className="h-12 px-6 border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 rounded-xl font-bold bg-white shadow-sm"
                  >
                    +7d Trial
                  </Button>
                  <Button 
                    onClick={() => handleUpdateSubscription('active', 30)}
                    disabled={isUpdating}
                    className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 border-none"
                  >
                    +30d Active
                  </Button>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  {agency.subscription_status === 'paused' ? (
                    <Button onClick={() => handleUpdateSubscription('active')} disabled={isUpdating} variant="outline" className="h-12 flex-1 rounded-xl font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                      <PlayCircle className="w-5 h-5 mr-2" /> Resume
                    </Button>
                  ) : (
                    <Button onClick={() => handleUpdateSubscription('paused')} disabled={isUpdating} variant="outline" className="h-12 flex-1 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50">
                      <PauseCircle className="w-5 h-5 mr-2" /> Pause
                    </Button>
                  )}
                  <Button onClick={() => handleUpdateSubscription('expired')} disabled={isUpdating} variant="outline" className="h-12 flex-1 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50">
                    <StopCircle className="w-5 h-5 mr-2" /> Expire
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-8 rounded-[2rem] shadow-sm space-y-8">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Agency Invites
            </h3>
            
            <p className="text-slate-500 font-medium text-sm">
              Use these tools to manually onboard members to this agency if their automatic emails are failing.
            </p>

            <div className="bg-slate-50 rounded-2xl p-6">
              <InviteButtons 
                agencyId={agency.id} 
                agencyName={agency.name} 
                contactEmail={agency.contact_email} 
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <p>Full payment gateway integration and automated invoice tracking will be activated on this page shortly.</p>
            </div>
          </Card>

        </div>
      )}
    </div>
  )
}
