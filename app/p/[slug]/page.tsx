import React from "react"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Compass,
  CarFront,
  IndianRupee,
  CheckCircle2,
  Phone,
  Zap,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getPublicProperty } from "@/lib/actions/properties"
import { formatCurrency, formatBudget } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PropertyImageGallery } from "@/components/properties/property-gallery"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const property = await getPublicProperty(slug)

  if (!property) {
    return {
      robots: { index: false, follow: false }
    }
  }

  const agency = property.agency

  const images = []
  if (agency.logo_url) {
    images.push(agency.logo_url)
  }
  if (property.cover_image_url) {
    images.push(property.cover_image_url)
  }

  return {
    title: `${property.title} | ${agency.name}`,
    description: `Check out this property for ${property.listing_type} in ${property.locality}, ${property.city}.`,
    openGraph: {
      title: `${property.title} | ${agency.name}`,
      description: `Check out this property for ${property.listing_type} in ${property.locality}, ${property.city}.`,
      images: images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} | ${agency.name}`,
      description: `Check out this property for ${property.listing_type} in ${property.locality}, ${property.city}.`,
      images: images,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicPropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicProperty(slug)

  if (!property) notFound()

  const agency = property.agency
  const whatsappLink = `https://wa.me/${agency.contact_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hi, I'm interested in this property: ${property.title}. View it here: ${process.env.NEXT_PUBLIC_APP_URL || ''}/p/${property.slug}`
  )}`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Premium Branding Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100/60 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 p-1.5 flex items-center justify-center shrink-0">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 tracking-tight text-sm leading-tight uppercase">{agency.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Property Specialist</span>
              {agency.rera_number && (
                <>
                  <span className="text-slate-200 text-[10px]">•</span>
                  <span className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">RERA: {agency.rera_number}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            {agency.website && (
              <a href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center flex hover:bg-slate-200 transition-colors shadow-sm">
                <Globe className="w-4 h-4 text-slate-600" />
              </a>
            )}
            {agency.facebook_url && (
              <a href={agency.facebook_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center flex hover:bg-blue-100 transition-colors shadow-sm">
                <Facebook className="w-4 h-4 text-blue-600" />
              </a>
            )}
            {agency.instagram_url && (
              <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-pink-50 items-center justify-center flex hover:bg-pink-100 transition-colors shadow-sm">
                <Instagram className="w-4 h-4 text-pink-600" />
              </a>
            )}
            {agency.linkedin_url && (
              <a href={agency.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center flex hover:bg-blue-100 transition-colors shadow-sm">
                <Linkedin className="w-4 h-4 text-blue-700" />
              </a>
            )}
            {agency.twitter_url && (
              <a href={agency.twitter_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-sky-50 items-center justify-center flex hover:bg-sky-100 transition-colors shadow-sm">
                <Twitter className="w-4 h-4 text-sky-500" />
              </a>
            )}
          </div>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl gap-2 h-10 px-5 shadow-lg shadow-emerald-100 transition-all active:scale-95">
              <Phone className="w-3.5 h-3.5" />
              Contact
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pb-32">
        {/* Gallery Section - Full width on mobile */}
        <section className="bg-white md:rounded-3xl md:mt-6 md:overflow-hidden md:mx-4 md:shadow-xl md:border md:border-slate-100">
          <PropertyImageGallery
            images={property.image_urls || []}
            coverImage={property.cover_image_url}
          />
        </section>

        <div className="px-5 py-8 space-y-10">
          {/* Title & Price Section */}
          <section className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-900 text-white border-none text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider">
                {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 font-black text-[10px] uppercase px-4 py-1.5 rounded-full tracking-wider">
                {property.property_type.replace(/_/g, ' ')}
              </Badge>
              {property.status !== 'available' && (
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/50 font-black text-[10px] uppercase px-4 py-1.5 rounded-full">
                  {property.status}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
                {property.title}
              </h1>
              <div className="flex items-center text-slate-500 font-bold text-sm">
                <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                {property.locality ? `${property.locality}, ` : ''}{property.city}
              </div>
            </div>

            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center sm:items-start gap-1">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Asking Price</span>
              <span className="text-5xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(property.price)}
              </span>
            </div>

            {property.video_url && (
              <a
                href={property.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-linear-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Zap className="w-7 h-7 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Watch Video Tour</h3>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Experience the property live</p>
                  </div>
                </div>
              </a>
            )}
          </section>

          {/* Location & Address Section */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Location Details</h3>
                <div className="flex items-center text-slate-900 font-black text-lg gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  {property.locality}, {property.city}
                </div>
              </div>
              {property.google_maps_url && (
                <a
                  href={property.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" className="rounded-xl border-emerald-100 text-emerald-600 font-bold hover:bg-emerald-50 h-10 px-4">
                    View on Maps
                  </Button>
                </a>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Address</p>
                <p className="text-slate-700 font-bold leading-relaxed">
                  {property.address || `${property.locality}, ${property.city}`}
                  {property.pincode && <span className="ml-1 text-slate-400 font-medium"> - {property.pincode}</span>}
                </p>
              </div>
            </div>
          </section>

          {/* High-Impact Specs Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {property.bhk && property.bhk.length > 0 && (
              <QuickSpec label="BHK" value={`${property.bhk.sort((a, b) => a - b).join(", ")} BHK`} icon={<BedDouble className="w-4 h-4" />} />
            )}
            {property.bedrooms > 0 && (
              <QuickSpec label="Bedrooms" value={`${property.bedrooms}`} icon={<BedDouble className="w-4 h-4" />} />
            )}
            {property.bathrooms > 0 && (
              <QuickSpec label="Bathrooms" value={`${property.bathrooms}`} icon={<Bath className="w-4 h-4" />} />
            )}
            {property.area_sqft && (
              <QuickSpec
                label="Area Size"
                value={`${property.area_sqft.toLocaleString()} ${property.area_unit || 'sqft'}`}
                icon={<Maximize2 className="w-4 h-4" />}
              />
            )}
            {property.facing && (
              <QuickSpec label="Facing" value={property.facing} icon={<Compass className="w-4 h-4" />} capitalize />
            )}
            {property.road_info && (
              <QuickSpec label="Road Width" value={property.road_info} icon={<Zap className="w-4 h-4" />} />
            )}
          </section>

          {/* Detailed Specifications Section */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Specifications</h3>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] px-3 py-1 uppercase">✓ Verified Listing</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <SpecRow label="Property Type" value={property.property_type.replace(/_/g, ' ')} />
              <SpecRow label="Listing Type" value={property.listing_type} />
              <SpecRow label="Current Status" value={property.status} />
              <SpecRow label="Approval Authority" value={property.approval_type || "General"} />
              {property.balconies && property.balconies > 0 && (
                <SpecRow label="Balconies" value={String(property.balconies)} />
              )}

              {/* Conditional rows */}
              {(property.property_type === 'plot' || property.property_type === 'farmhouse' || property.property_type === 'farmer_land') && property.group && (
                <SpecRow label="Plot Group / Block" value={property.group} />
              )}
              {property.furnishing && (
                <SpecRow label="Furnishing" value={property.furnishing.replace(/_/g, ' ')} />
              )}
              {property.parking && property.parking !== 'null' && (
                <SpecRow label="Parking" value={property.parking} />
              )}
              {property.total_floors && (
                <SpecRow label="Floor Level" value={property.floor_number ? `${property.floor_number} of ${property.total_floors}` : `Total ${property.total_floors} Floors`} />
              )}
              {property.maintenance_charge && property.maintenance_charge > 0 && (
                <SpecRow label="Maintenance" value={`₹${Number(property.maintenance_charge).toLocaleString()}/mo`} />
              )}
              <SpecRow label="Price Negotiable" value={property.price_negotiable ? "Yes" : "No"} />
              {property.dimensions && (
                <SpecRow label="Dimensions" value={property.dimensions} />
              )}
            </div>
          </section>

          {/* Description Section */}
          {property.description && (
            <section className="space-y-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Property Description</h3>
              <p className="text-slate-600 leading-relaxed text-base font-medium whitespace-pre-wrap">
                {property.description}
              </p>
            </section>
          )}

          {/* Features Section */}
          {property.amenities && property.amenities.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Highlights & Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modern Glassmorphism Floating CTA (Mobile) */}
      <footer className="fixed bottom-0 inset-x-0 p-6 bg-white/60 backdrop-blur-2xl border-t border-white/20 md:hidden z-50">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          <Button className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-slate-400/20 transition-all active:scale-[0.97] gap-3 text-lg">
            <Zap className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            Book Site Visit
          </Button>
        </a>
      </footer>

      {/* Desktop Floating Action Box */}
      <div className="hidden md:block fixed bottom-10 right-10 w-96 bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10 z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-2xl font-black tracking-tight leading-tight">Love this property?</h4>
            <p className="text-sm text-slate-400 font-leading-relaxed">Contact <span className="text-emerald-400">{agency.name}</span> today to schedule an exclusive viewing.</p>
          </div>
          <div className="">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl gap-3 text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
                <Zap className="w-5 h-5 fill-white" />
                WhatsApp Now
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-5 justify-center pt-3 border-t border-slate-700 mt-5">
            {agency.website && (
              <a href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                <Globe className="w-5 h-5" />
              </a>
            )}
            {agency.facebook_url && (
              <a href={agency.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 hover:scale-110 transition-all shadow-lg">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {agency.instagram_url && (
              <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-900/30 hover:scale-110 transition-all shadow-lg">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {agency.linkedin_url && (
              <a href={agency.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-900/30 hover:scale-110 transition-all shadow-lg">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {agency.twitter_url && (
              <a href={agency.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:bg-sky-900/30 hover:scale-110 transition-all shadow-lg">
                <Twitter className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickSpec({ label, value, icon, capitalize }: { label: string; value: string; icon: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="p-2.5 w-fit rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={cn("text-base font-black text-slate-900 tracking-tighter leading-none", capitalize && "capitalize")}>{value}</p>
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0 group">
      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-slate-900 text-sm font-black capitalize tracking-tight group-hover:text-emerald-600 transition-colors">{value}</span>
    </div>
  )
}

