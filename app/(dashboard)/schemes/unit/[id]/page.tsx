export const dynamic = "force-dynamic";
import React from 'react'
import { getUnitDetails } from '@/lib/actions/inventory'
import { requireProfile } from '@/lib/auth/get-session'
import { notFound } from 'next/navigation'
import { QuickUpdateForm } from '@/components/schemes/quick-update-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Maximize2,
  Compass,
  IndianRupee,
  FileText,
  CheckCircle2,
  Lock,
  User,
  Info,
  Navigation,
  Edit2,
  Image as ImageIcon,
  Video
} from 'lucide-react'
import { updateScheme } from '@/lib/actions/inventory'
import { revalidatePath } from 'next/cache'
import { ImageZoom } from '@/components/schemes/image-zoom'

export default async function UnitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await getUnitDetails(id)
  const profile = await requireProfile()

  if (!unit) {
    notFound()
  }

  const scheme = unit.scheme as any
  const builder = scheme.builder
  const details = (unit.details as any) || {}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 shadow-emerald-500/20'
      case 'hold': return 'bg-amber-500 shadow-amber-500/20'
      case 'booked': return 'bg-blue-500 shadow-blue-500/20'
      case 'sold': return 'bg-rose-500 shadow-rose-500/20'
      default: return 'bg-slate-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available'
      case 'hold': return 'On Hold'
      case 'booked': return 'Booked'
      case 'sold': return 'Sold'
      default: return status
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Header Nav */}
      <div className="flex items-center gap-3">
        <Link href={`/schemes/view/${scheme.id}`}>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Link href={`/schemes/city/${encodeURIComponent(builder.city)}`} className="hover:text-emerald-600 transition-colors">{builder.city}</Link>
            <span>›</span>
            <span className="truncate max-w-[100px] sm:max-w-xs">{builder.name}</span>
            <span>›</span>
            <Link href={`/schemes/view/${scheme.id}`} className="hover:text-emerald-600 transition-colors truncate max-w-[100px] sm:max-w-xs">{scheme.name}</Link>
          </div>
        </div>
      </div>

      {/* Main Unit Card */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        {/* Status Decoration */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 rounded-full opacity-40",
          getStatusColor(unit.status).split(' ')[0]
        )} />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {unit.unit_number.startsWith('Plot') ? unit.unit_number.replace('Plot ', 'Plot-') : `Plot-${unit.unit_number}`}
              </h1>
              <Badge className={cn(
                "px-3 py-1 uppercase tracking-widest text-[10px] font-black border-none",
                unit.status === 'available' ? "bg-emerald-100 text-emerald-700" :
                  unit.status === 'hold' ? "bg-amber-100 text-amber-700" :
                    unit.status === 'booked' ? "bg-blue-100 text-blue-700" :
                      "bg-rose-100 text-rose-700"
              )}>
                {getStatusText(unit.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {scheme.name}
            </div>
            {details.broker && (
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm mt-1">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-slate-700">Broker: {details.broker}</span>
              </div>
            )}
          </div>
          <div className="text-left sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px]">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Approximate Value</p>
            <div className="flex items-center sm:justify-end gap-1 text-slate-900">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
              <span className="text-3xl font-black tracking-tighter">
                {((unit.rate_per_sqyd || 0) * (unit.area_sqyd || 0)).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Based on ₹{(unit.rate_per_sqyd || 0).toLocaleString()}/sqyd</p>
          </div>
        </div>

        {/* Primary Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <Maximize2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Dimensions</span>
            </div>
            <p className="text-lg font-black text-slate-900">{unit.dimensions || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Area</span>
            </div>
            <p className="text-lg font-black text-slate-900">{unit.area_sqyd} <span className="text-[10px] text-slate-500">SqYd</span></p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <Compass className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Facing</span>
            </div>
            <p className="text-lg font-black text-slate-900">{unit.facing || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <Navigation className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Road Info</span>
            </div>
            <p className="text-lg font-black text-slate-900">{details.road_info || 'N/A'}</p>
          </div>
        </div>

        {/* Description & Advantages */}
        {details.description && (
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Plot Description & Advantages
            </h3>
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
              <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap text-sm">
                {details.description}
              </p>
            </div>
          </div>
        )}

        {/* Visuals Section (Img & Video) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Site Map Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-500" />
              Project Layout Plan
            </h3>
            {scheme.map_image_url ? (
              <ImageZoom
                src={scheme.map_image_url}
                alt={`${scheme.name} Site Map`}
                title={`${scheme.name} - Layout Plan`}
              />
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] h-[240px] flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-10 leading-relaxed">Layout plan not available for this project yet</p>
              </div>
            )}
          </div>

          {/* Video Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500" />
              Video Walkthrough
            </h3>
            {scheme.video_url ? (
              <div className="bg-slate-900 rounded-[2rem] h-[240px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
                {/* Visual backdrop for video card */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 opacity-50 group-hover:opacity-70 transition-opacity" />

                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-white font-black text-lg mb-2 relative z-10">Tour this Township</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">High-Definition Walkthrough</p>

                <Link href={scheme.video_url} target="_blank" className="relative z-10 w-full max-w-[200px]">
                  <Button className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] shadow-xl">
                    Play Video Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] h-[240px] flex flex-col items-center justify-center text-center">
                <Video className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-10 leading-relaxed">Video walkthrough hasn't been uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Scheme Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 sm:p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              About {scheme.name}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {scheme.description || "This township features state-of-the-art infrastructure including 40ft wide internal roads, underground electricity, and a dedicated park area. All plots are approved and ready for possession."}
            </p>
          </div>
          <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Location Info
            </h3>
            {scheme.location_details ? (
              <p className="text-slate-300 font-medium leading-relaxed text-sm whitespace-pre-wrap">
                {scheme.location_details}
              </p>
            ) : (
              <ul className="space-y-3">
                {['2km from Metro Station', 'Near International School', '5 min from Hospital', '24/7 Security'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-bold text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Buttons (If Available) */}
        {unit.status === 'available' && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <Link href={`/schemes/view/${scheme.id}`} className="w-full sm:w-auto flex-1">
              <Button className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all text-sm">
                <Lock className="w-5 h-5 mr-2" />
                Hold Unit (24h)
              </Button>
            </Link>
            <Link href={`/schemes/view/${scheme.id}`} className="w-full sm:w-auto flex-1">
              <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider shadow-xl shadow-slate-900/20 transition-all text-sm">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </Link>
          </div>
        )}

        {unit.status !== 'available' && (
          <div className="pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-500">
                This unit is currently <span className="text-slate-900 uppercase">{getStatusText(unit.status)}</span>.
                Please select another unit or contact the agent.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Visual Management Section */}
      {/* {(profile.role === 'admin' || profile.is_super_admin) && (
        <QuickUpdateForm 
          schemeId={scheme.id} 
          initialMapUrl={scheme.map_image_url || ''} 
          initialVideoUrl={scheme.video_url || ''}
        />
      )} */}
    </div>
  )
}
