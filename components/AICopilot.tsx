'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, Sparkles, User, Loader2, Minimize2, Phone, BarChart2, Users, Home, Star, BotMessageSquare, X, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Price formatter (mirrors backend) ────────────────────────────────────────
function fmtPrice(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Tool Result Renderers ─────────────────────────────────────────────────────
function PropertyCard({ p }: { p: any }) {
  return (
    <Link
      href={`/properties/${p.id}`}
      className="block bg-slate-50 rounded-lg border border-slate-100 p-2.5 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
    >
      <div className="flex items-start gap-2">
        {p.cover_image_url && (
          <img src={p.cover_image_url} alt={p.title} className="w-14 h-12 object-cover rounded-md flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate group-hover:text-emerald-700">{p.title}</div>
          <div className="text-emerald-600 font-bold text-sm">{p.price_formatted ?? fmtPrice(p.price)}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>{p.bhk_display ?? (Array.isArray(p.bhk) ? p.bhk.join('/') + ' BHK' : `${p.bhk} BHK`)}</span>
            <span className="text-slate-300">•</span>
            <span>{p.locality}</span>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
          p.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
          p.status === 'hold' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-600'
        }`}>{p.status}</span>
      </div>
    </Link>
  );
}

function FindPropertiesResult({ part, onClose }: { part: any; onClose: () => void }) {
  const result = part.output as any;
  const args = part.input as any;
  const queryParams = new URLSearchParams();
  if (args?.bhk) queryParams.set('bhk', args.bhk.toString());
  if (args?.locality) queryParams.set('search', args.locality);
  const qs = queryParams.toString();

  if (result?.error) return <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{result.error}</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full space-y-1.5 mt-1">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Properties</span>
        <span className={`px-2 py-0.5 rounded-full ${result.count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {result.count} found
        </span>
      </div>
      {result.count === 0 && (
        <p className="text-xs text-slate-500 text-center py-2">No matching properties found. Try adjusting your filters.</p>
      )}
      {result.properties?.slice(0, 3).map((p: any) => (
        <div key={p.id} onClick={onClose}>
          <PropertyCard p={p} />
        </div>
      ))}
      {result.count > 0 && (
        <Link
          href={`/properties${qs ? `?${qs}` : ''}`}
          onClick={onClose}
          className="w-full mt-1 py-2 flex items-center justify-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
        >
          View {result.count > 3 ? `all ${result.count}` : 'matching'} properties →
        </Link>
      )}
    </div>
  );
}

function FindClientsResult({ part, onClose }: { part: any; onClose: () => void }) {
  const result = part.output as any;

  if (result?.error) return <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{result.error}</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full space-y-1.5 mt-1">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Leads / Clients</span>
        <span className={`px-2 py-0.5 rounded-full ${result.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
          {result.count} found
        </span>
      </div>
      {result.count === 0 && (
        <p className="text-xs text-slate-500 text-center py-2">No clients match these filters.</p>
      )}
      {result.clients?.slice(0, 4).map((c: any) => (
        <Link key={c.id} href={`/clients/${c.id}`} onClick={onClose}
          className="block bg-slate-50 rounded-lg border border-slate-100 p-2.5 hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-800 text-sm">{c.full_name}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              c.priority === 'high' ? 'bg-red-100 text-red-700' :
              c.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>{c.priority}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</span>
            {c.budget_display && <span>• {c.budget_display}</span>}
          </div>
          {c.preferred_locations?.length > 0 && (
            <div className="text-xs text-blue-600 mt-0.5">Looking in: {c.preferred_locations.slice(0,3).join(', ')}</div>
          )}
        </Link>
      ))}
      {result.count > 0 && (
        <Link href="/clients" onClick={onClose}
          className="w-full mt-1 py-2 flex items-center justify-center text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
        >
          View all leads →
        </Link>
      )}
    </div>
  );
}

function SmartMatchesResult({ part }: { part: any }) {
  const result = part.output as any;
  if (result?.error) return <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{result.error}</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full space-y-1.5 mt-1">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Smart Matches</span>
        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{result.count} matches</span>
      </div>
      {result.count === 0 && <p className="text-xs text-slate-500 text-center py-2">No matches found yet.</p>}
      {result.matches?.slice(0, 4).map((m: any) => {
        const display = m.client || m.property;
        const isClient = !!m.client;
        return (
          <div key={m.id} className="bg-slate-50 rounded-lg border border-slate-100 p-2.5">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 text-sm">
                {isClient ? m.client.full_name : m.property?.title ?? '—'}
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {m.score}% match
              </span>
            </div>
            {isClient && m.client?.phone && (
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{m.client.phone}</div>
            )}
            {!isClient && m.property && (
              <div className="text-xs text-slate-500 mt-0.5">{m.property.locality} • {fmtPrice(m.property.price)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AgencyStatsResult({ part }: { part: any }) {
  const s = part.output as any;
  if (s?.error) return <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{s.error}</div>;

  const statItems = [
    { label: 'Total Properties', value: s.properties?.total ?? 0, color: 'emerald' },
    { label: 'Available', value: s.properties?.by_status?.available ?? 0, color: 'green' },
    { label: 'Total Leads', value: s.leads?.total ?? s.leads?.new_this_period ?? 0, color: 'blue' },
    { label: 'Calls Logged', value: s.interactions?.calls_logged ?? 0, color: 'indigo' },
    { label: 'Active Bookings', value: s.bookings?.active ?? 0, color: 'amber' },
    { label: 'Revenue', value: s.bookings?.total_revenue_formatted ?? '₹0', color: 'purple', isString: true },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full mt-1">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        <span className="flex items-center gap-1">
          <BarChart2 className="w-3 h-3" />
          {s.target && s.target !== 'Agency / All' ? `Agent Stats: ${s.target}` : 'Agency Stats'}
        </span>
        <span className="text-slate-400 normal-case font-normal">This {s.period}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {statItems.map(item => (
          <div key={item.label} className={`bg-${item.color}-50 rounded-lg p-2.5 border border-${item.color}-100`}>
            <div className={`text-lg font-bold text-${item.color}-700`}>{item.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {s.team_leaderboard && s.team_leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team Leaderboard</div>
          <div className="space-y-2">
            {s.team_leaderboard.map((a: any, idx: number) => (
              <div key={a.name} className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</div>
                  <span className="text-xs font-bold text-slate-800">{a.name}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center divide-x divide-slate-200">
                  <div className="flex flex-col items-center">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-slate-700">{a.properties_added}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-slate-700">{a.leads_added}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                    <span className="text-xs font-bold text-slate-700">{a.calls_logged}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                    <span className="text-xs font-bold text-emerald-600">{a.bookings_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/actions/clients';
import { createProperty } from '@/lib/actions/properties';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function DraftClientResult({ part, onClose }: { part: any; onClose: () => void }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  const result = part.output as any;
  if (!result || result.type !== 'draft') return null;
  const draft = result.data;

  // Restore saved state from localStorage
  useEffect(() => {
    const cached = localStorage.getItem(`saved-draft-${draft.phone}`);
    if (cached) setSavedId(cached);
  }, [draft.phone]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await createClient({
        full_name: draft.full_name,
        phone: draft.phone,
        looking_for: draft.looking_for || 'buy',
        property_types: draft.property_types || [],
        preferred_locations: draft.preferred_locations || [],
        budget_min: draft.budget_min || null,
        budget_max: draft.budget_max || null,
        preferred_bhks: draft.preferred_bhks || [],
        preferred_commercial_type: draft.preferred_commercial_type || null,
        priority: draft.priority || 'medium',
        min_area_sqft: draft.min_area_sqft || null,
        min_area_unit: draft.min_area_unit || null,
        notes: draft.notes || undefined,
        min_bedrooms: 0,
        source: 'walk_in'
      });
      
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        setSavedId(res.data.id);
        localStorage.setItem(`saved-draft-${draft.phone}`, res.data.id);
        toast.success("Lead saved perfectly!");
        router.refresh();
      }
    } catch (e) {
      toast.error("Failed to save lead");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-md w-full mt-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">
        <span className="flex items-center gap-1 text-blue-700"><Users className="w-4 h-4" /> Lead Draft</span>
        {savedId && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>

      <div className="pl-2 space-y-2 mb-3">
        <div className="font-bold text-slate-800 text-base">{draft.full_name}</div>
        <div className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {draft.phone}</div>
        
        <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1 mt-2 border border-slate-100">
          <div><span className="font-semibold text-slate-500">Wants to:</span> <span className="uppercase text-slate-700 font-bold">{draft.looking_for}</span></div>
          {draft.property_types?.length > 0 && <div><span className="font-semibold text-slate-500">Type:</span> {draft.property_types.join(', ')} {draft.preferred_commercial_type ? `(${draft.preferred_commercial_type})` : ''}</div>}
          {draft.min_area_sqft && <div><span className="font-semibold text-slate-500">Area:</span> {draft.min_area_sqft} {draft.min_area_unit || 'sqft'}</div>}
          {draft.preferred_locations?.length > 0 && <div><span className="font-semibold text-slate-500">Locations:</span> {draft.preferred_locations.join(', ')}</div>}
          {draft.budget_max && <div><span className="font-semibold text-slate-500">Budget:</span> Upto {fmtPrice(draft.budget_max)}</div>}
          {draft.notes && <div><span className="font-semibold text-slate-500">Notes:</span> <span className="italic text-slate-600">{draft.notes}</span></div>}
        </div>
      </div>

      {savedId ? (
        <Link href={`/clients/${savedId}`} onClick={onClose}
          className="w-full py-2 flex items-center justify-center text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Client Profile →
        </Link>
      ) : (
        <div className="flex gap-2 pl-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] py-2 flex items-center justify-center gap-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function DraftPropertyResult({ part, onClose }: { part: any; onClose: () => void }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  const result = part.output as any;
  if (!result || result.type !== 'draft_property') return null;
  const draft = result.data;

  // Restore saved state from localStorage (we use title as key since property doesn't have phone initially)
  useEffect(() => {
    const cached = localStorage.getItem(`saved-draft-prop-${draft.title}`);
    if (cached) setSavedId(cached);
  }, [draft.title]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await createProperty({
        title: draft.title,
        description: draft.description,
        property_type: draft.property_type,
        listing_type: draft.listing_type || 'sale',
        price: draft.price,
        locality: draft.locality,
        city: draft.city,
        status: 'available',
        bhk: draft.bhk || [],
        bedrooms: draft.bedrooms || null,
        bathrooms: draft.bathrooms || null,
        area_sqft: draft.area_sqft || null,
        area_unit: draft.area_unit || null,
        commercial_type: draft.commercial_type || null,
        amenities: draft.amenities || [],
        furnishing: draft.furnishing || null,
        dimensions: draft.dimensions || null,
        road_info: draft.road_info || null,
        facing: draft.facing || null,
        group: draft.group || null,
        approval_type: draft.approval_type || null,
        google_maps_url: draft.google_maps_url || null,
        maintenance_charge: draft.maintenance_charge || null,
        floor_number: draft.floor_number || null,
        total_floors: draft.total_floors || null,
        balconies: draft.balconies || null,
        parking: draft.parking || null,
        seller_name: draft.seller_name || null,
        seller_phone: draft.seller_phone || null,
        is_featured: false,
        is_new: true,
        image_urls: [],
        slug: undefined,
      });
      
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        const generatedId = res.data.id || '';
        setSavedId(generatedId);
        localStorage.setItem(`saved-draft-prop-${draft.title}`, generatedId);
        toast.success("Property saved perfectly!");
        router.refresh();
      }
    } catch (e) {
      toast.error("Failed to save property");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-3 shadow-md w-full mt-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
      
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">
        <span className="flex items-center gap-1 text-indigo-700"><Building2 className="w-4 h-4" /> Property Draft</span>
        {savedId && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>

      <div className="pl-2 space-y-2 mb-3">
        <div className="font-bold text-slate-800 text-base">{draft.title}</div>
        
        <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1 mt-2 border border-slate-100">
          <div><span className="font-semibold text-slate-500">For:</span> <span className="uppercase text-slate-700 font-bold">{draft.listing_type}</span></div>
          <div><span className="font-semibold text-slate-500">Type:</span> {draft.property_type} {draft.commercial_type ? `(${draft.commercial_type})` : ''}</div>
          <div><span className="font-semibold text-slate-500">Location:</span> {draft.locality}, {draft.city}</div>
          <div><span className="font-semibold text-slate-500">Price:</span> <span className="font-bold text-emerald-700">{fmtPrice(draft.price)}</span></div>
          {draft.area_sqft && <div><span className="font-semibold text-slate-500">Area:</span> {draft.area_sqft} {draft.area_unit || 'sqft'}</div>}
          {draft.dimensions && <div><span className="font-semibold text-slate-500">Dimensions:</span> {draft.dimensions}</div>}
          {draft.facing && <div><span className="font-semibold text-slate-500">Facing:</span> {draft.facing}</div>}
          {draft.road_info && <div><span className="font-semibold text-slate-500">Road:</span> {draft.road_info}</div>}
          {draft.approval_type && <div><span className="font-semibold text-slate-500">Approval:</span> {draft.approval_type}</div>}
          {draft.group && <div><span className="font-semibold text-slate-500">Group:</span> {draft.group}</div>}
          {draft.bhk?.length > 0 && <div><span className="font-semibold text-slate-500">BHK:</span> {draft.bhk.join(', ')}</div>}
          {draft.bedrooms && <div><span className="font-semibold text-slate-500">Rooms:</span> {draft.bedrooms} Bed, {draft.bathrooms} Bath</div>}
          {draft.parking && <div><span className="font-semibold text-slate-500">Parking:</span> {draft.parking}</div>}
          {draft.maintenance_charge && <div><span className="font-semibold text-slate-500">Maintenance:</span> ₹{draft.maintenance_charge}/mo</div>}
          {draft.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {draft.amenities.map((am: string, i: number) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">{am}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {savedId ? (
        <Link href={`/properties/${savedId}`} onClick={onClose}
          className="w-full py-2 flex items-center justify-center text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View Property →
        </Link>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 pl-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] py-2 flex items-center justify-center gap-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Property
            </button>
          </div>
          <div className="text-[10px] text-slate-400 text-center italic">
            Images can be added later from the edit page
          </div>
        </div>
      )}
    </div>
  );
}

function ToolResult({ part, onClose }: { part: any; onClose: () => void }) {
  const toolName = part.toolName ?? (part.type?.replace('tool-', '') ?? '');
  if (toolName === 'find_properties') return <FindPropertiesResult part={part} onClose={onClose} />;
  if (toolName === 'find_clients')    return <FindClientsResult part={part} onClose={onClose} />;
  if (toolName === 'find_smart_matches') return <SmartMatchesResult part={part} />;
  if (toolName === 'get_agency_stats')   return <AgencyStatsResult part={part} />;
  if (toolName === 'draft_client')       return <DraftClientResult part={part} onClose={onClose} />;
  if (toolName === 'draft_property')     return <DraftPropertyResult part={part} onClose={onClose} />;
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AICopilot({ role }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');

  const { messages, status, sendMessage, setMessages } = useChat({});
  const isLoading = status === 'streaming' || status === 'submitted';

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: localInput },
      { id: (Date.now() + 1).toString(), role: 'assistant', content: "🤖 DevSia AI Copilot is currently paused for weekend maintenance and updates. We will be back online this Monday!" }
    ]);
    setLocalInput('');
    return;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Quick-action suggestions shown when chat is empty
  const suggestions = role === 'agent' ? [
    'Add a new property',
    'Add a new lead',
    'Show my stats this month',
    'My active clients',
  ] : [
    'Add a new property',
    'Add a new lead',
    'Show agency stats',
    'Active team members this week',
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full shadow-2xl flex items-center justify-center text-white border-2 border-emerald-300/30 group"
          >
            <BotMessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[390px] h-[100dvh] sm:h-[800px] sm:max-h-[90vh] bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">DevSia Copilot</h3>
                  <p className="text-xs text-emerald-100 opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
                    Always here to help
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Ask me anything!</p>
                    <p className="text-xs text-slate-400 mt-1">Properties, leads, stats, matches...</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => {
        setMessages([
          ...messages,
          { id: Date.now().toString(), role: 'user', content: s },
          { id: (Date.now() + 1).toString(), role: 'assistant', content: "🤖 DevSia AI Copilot is currently paused for weekend maintenance and updates. We will be back online this Monday!" }
        ]);
    }}
                        className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-left shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const textContent = m.parts
                    ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
                    : (typeof (m as any).content === 'string' ? (m as any).content : '');

                  const toolParts = m.parts
                    ? m.parts.filter((p: any) =>
                        (p.type?.startsWith('tool-') || p.type === 'tool-result') &&
                        p.state === 'output-available'
                      )
                    : [];

                  return (
                    <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`flex flex-col gap-1.5 max-w-[82%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Spinner while tool is running */}
                        {m.parts?.some((p: any) => p.type === 'step-start') && !textContent && toolParts.length === 0 && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Searching database...
                          </div>
                        )}

                        {textContent && (
                          <div className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${
                            m.role === 'user'
                              ? 'bg-slate-900 text-white rounded-tr-sm'
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                          }`}>
                            {textContent}
                          </div>
                        )}

                        {toolParts.map((part: any, idx: number) => (
                          <ToolResult key={part.toolCallId ?? idx} part={part} onClose={() => setIsOpen(false)} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={onSubmit} className="relative flex items-center gap-2">
                <input
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask about properties, leads, stats..."
                  className="flex-1 bg-slate-100 border-none rounded-full py-3 pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !localInput.trim()}
                  className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-sm shrink-0"
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
                  }
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400">AI can make mistakes. Please verify important information.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
