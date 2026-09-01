'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { MapPin, Phone, Briefcase, Mail, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useSWR from 'swr'
import { getAssociates, updateAssociateStatus } from '@/lib/actions/associates'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function AssociatesClient({ agencyId }: { agencyId: string }) {
  const { data: applications, isLoading, error, mutate } = useSWR('associates', () => getAssociates())
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsUpdating(id)
      await updateAssociateStatus(id, status)
      toast.success(`Application ${status}!`)
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Associate Applications</h1>
        <p className="text-sm text-slate-500 font-medium">Review candidates who applied via your website</p>
      </div>

      <div className="relative">
        {isLoading && (
           <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 rounded-[1.5rem] flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
           </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-[1.5rem] border border-red-100 border-dashed">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 text-center max-w-sm mb-6">Could not fetch associate applications.</p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-slate-300 transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : isLoading && (!applications || applications.length === 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 border-slate-200 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : !applications || applications.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No applications yet</h3>
            <p className="text-slate-500 text-sm mt-1">When someone fills out the Associate form on your website, it will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applications.map((app: any) => (
              <Card key={app.id} className="p-6 border-slate-200 hover:border-slate-300 transition-all group">
                <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {app.full_name}
                    {app.status === 'pending' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">New</span>}
                    {app.status === 'approved' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">Approved</span>}
                    {app.status === 'rejected' && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Rejected</span>}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Applied {formatDistanceToNow(new Date(app.created_at))} ago</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{app.mobile_number}</span>
                </div>
                {app.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-medium truncate">{app.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{app.city || 'No city'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{app.experience_level || 'Fresher'}</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Occupation</span>
                  <span className="text-slate-900 font-semibold text-right">{app.current_occupation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Property Types</span>
                  <span className="text-slate-900 font-semibold text-right">{app.property_types?.join(', ') || 'Any'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Deals Closed (12mo)</span>
                  <span className="text-slate-900 font-semibold text-right">{app.deals_closed_last_year || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Works with other company?</span>
                  <span className="text-slate-900 font-semibold text-right">{app.works_with_other_company ? 'Yes' : 'No'}</span>
                </div>
                {app.works_with_other_company && app.other_company_name && (
                  <div className="flex justify-between pt-2 mt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Company Name</span>
                    <span className="text-slate-900 font-semibold text-right">{app.other_company_name}</span>
                  </div>
                )}
              </div>

              {app.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(app.id, 'approved')}
                    disabled={isUpdating === app.id}
                    className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isUpdating === app.id ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(app.id, 'rejected')}
                    disabled={isUpdating === app.id}
                    className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-bold h-11 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isUpdating === app.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                  </button>
                </div>
              )}
            </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
