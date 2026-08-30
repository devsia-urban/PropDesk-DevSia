'use client'

import React, { useState } from "react"
import { Building2, Globe, Mail, MapPin, Phone, Upload, Loader2, Save, Image as ImageIcon, Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Agency } from "@/lib/types/database"
import { updateAgencyBranding } from "@/lib/actions/agency"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BrandingSettingsProps {
  agency: Agency
}

export function BrandingSettings({ agency }: BrandingSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: agency.name || "",
    logo_url: agency.logo_url || "",
    website: agency.website || "",
    contact_phone: agency.contact_phone || "",
    contact_email: agency.contact_email || "",
    address: agency.address || "",
    facebook_url: agency.facebook_url || "",
    instagram_url: agency.instagram_url || "",
    linkedin_url: agency.linkedin_url || "",
    twitter_url: agency.twitter_url || ""
  })
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateAgencyBranding(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Agency branding updated successfully!")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="h-24 bg-linear-to-r from-emerald-500 to-teal-600" />
          <CardContent className="pt-0 -mt-12 text-center pb-8">
            <div className="relative inline-block group">
              <div className="h-24 w-24 rounded-3xl bg-white p-1 shadow-xl border-4 border-white overflow-hidden mx-auto">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-slate-200" />
                  </div>
                )}
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">{formData.name || "Your Agency"}</h3>
            <p className="text-sm text-slate-500 font-medium">{formData.website || "No website set"}</p>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Branding & Identity</CardTitle>
            <CardDescription className="text-slate-500">
              Customize how your agency appears to your team and clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Agency Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Nexora Real Estate"
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Logo URL</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="www.youragency.com"
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="contact@agency.com"
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+91..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="City, State"
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Facebook URL</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      value={formData.facebook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instagram URL</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-600" />
                    <Input
                      value={formData.instagram_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">LinkedIn URL</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700" />
                    <Input
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Twitter URL</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <Input
                      value={formData.twitter_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                      placeholder="https://twitter.com/..."
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
