'use client'

import React from "react"
import { SaasLead } from "@/lib/types/database"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ManageSaasLeadDialog } from "./manage-saas-lead-dialog"
import { Check, X, Phone, Building2 } from "lucide-react"

interface SaasLeadsTableProps {
  leads: SaasLead[]
}

const statusColors: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Demo Sent': 'bg-amber-50 text-amber-700 border-amber-200',
  'Trial Started': 'bg-violet-50 text-violet-700 border-violet-200',
  'Converted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Dormant': 'bg-slate-100 text-slate-600 border-slate-200',
  'OLD': 'bg-slate-200 text-slate-800 border-slate-300'
}

const interestColors: Record<string, string> = {
  'HOTTEST': 'bg-red-100 text-red-800 border-red-200',
  'Hot': 'bg-orange-100 text-orange-800 border-orange-200',
  'Warm': 'bg-amber-100 text-amber-800 border-amber-200',
  'Cold': 'bg-blue-100 text-blue-800 border-blue-200',
  'not intrested': 'bg-slate-100 text-slate-600 border-slate-200',
}

export function SaasLeadsTable({ leads }: SaasLeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No prospects yet</h3>
        <p className="text-slate-500 mt-1 max-w-sm">Start adding real estate agencies you want to pitch DevSia to.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200 font-bold">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200">Agency</th>
              <th className="px-4 py-3 border-r border-slate-200">Contact</th>
              <th className="px-4 py-3 border-r border-slate-200">Phone & Email</th>
              <th className="px-4 py-3 border-r border-slate-200">Status</th>
              <th className="px-4 py-3 border-r border-slate-200">Interest</th>
              <th className="px-4 py-3 border-r border-slate-200">Source</th>
              <th className="px-4 py-3 border-r border-slate-200">Trial Password</th>
              <th className="px-4 py-3 border-r border-slate-200">Follow-up</th>
              <th className="px-4 py-3 border-r border-slate-200 text-center">Event / Called / Attended / Review</th>
              <th className="px-4 py-3 border-r border-slate-200 min-w-[200px]">Notes</th>
              <th className="px-4 py-3 sticky right-0 bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-2 border-r border-slate-100">
                  <div className="font-bold text-slate-900 truncate max-w-[150px]" title={lead.agency_name}>
                    {lead.agency_name}
                  </div>
                  {lead.city && <div className="text-[10px] text-slate-500 mt-0.5">{lead.city}</div>}
                </td>
                
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-700">
                  {lead.contact_name}
                </td>
                
                <td className="px-4 py-2 border-r border-slate-100">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </a>
                  )}
                  {lead.email && <div className="text-xs text-slate-500 mt-1">{lead.email}</div>}
                </td>
                
                <td className="px-4 py-2 border-r border-slate-100">
                  <Badge variant="outline" className={`font-bold text-[10px] whitespace-nowrap ${statusColors[lead.status] || statusColors['New']}`}>
                    {lead.status}
                  </Badge>
                </td>
                
                <td className="px-4 py-2 border-r border-slate-100">
                  {lead.interest_level ? (
                    <Badge variant="outline" className={`font-bold text-[10px] uppercase whitespace-nowrap ${interestColors[lead.interest_level] || 'bg-slate-50 text-slate-600'}`}>
                      {lead.interest_level}
                    </Badge>
                  ) : <span className="text-slate-300">-</span>}
                </td>

                <td className="px-4 py-2 border-r border-slate-100 text-slate-600 text-xs">
                  {lead.source || <span className="text-slate-300">-</span>}
                </td>

                <td className="px-4 py-2 border-r border-slate-100 text-slate-600 text-xs font-mono">
                  {lead.trial_password || <span className="text-slate-300">-</span>}
                </td>

                <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap text-xs">
                  {lead.follow_up_date ? (
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      {format(new Date(lead.follow_up_date), 'MMM d, h:mm a')}
                    </span>
                  ) : <span className="text-slate-300">-</span>}
                </td>

                <td className="px-4 py-2 border-r border-slate-100">
                  <div className="flex items-center justify-center gap-3">
                    <BooleanIcon value={lead.event_scheduled} title="Event Scheduled" />
                    <BooleanIcon value={lead.called_for_meeting} title="Called for Meeting" />
                    <BooleanIcon value={lead.attended_meeting} title="Attended Meeting" />
                    <BooleanIcon value={lead.review_requested} title="Review Requested" />
                  </div>
                </td>

                <td className="px-4 py-2 border-r border-slate-100 text-xs text-slate-600 max-w-[250px] truncate" title={lead.notes || ""}>
                  {lead.notes || <span className="text-slate-300">-</span>}
                </td>

                <td className="px-4 py-2 sticky right-0 bg-white group-hover:bg-slate-50/80 border-l border-slate-200 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.02)]">
                  <ManageSaasLeadDialog lead={lead} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BooleanIcon({ value, title }: { value: boolean, title: string }) {
  return (
    <div title={title} className={`flex items-center justify-center w-5 h-5 rounded-md ${value ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
      {value ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
    </div>
  )
}
