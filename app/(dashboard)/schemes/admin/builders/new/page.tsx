'use client'

import React, { useState } from 'react'
import { createBuilder } from '@/lib/actions/inventory'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, MapPin, Info, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewBuilderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await createBuilder({
        name: formData.get('name') as string,
        city: formData.get('city') as string,
        description: formData.get('description') as string,
        logo_url: formData.get('logo_url') as string,
      })
      toast.success('Builder added successfully!')
      router.push('/schemes/admin')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/schemes/admin">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Builder</h1>
      </div>

      <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Builder Name</Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g., Skyline Developers" 
                  required 
                  className="pl-11 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">City / Location</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="city" 
                  name="city" 
                  placeholder="e.g., Jaipur" 
                  required 
                  className="pl-11 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Logo URL (Optional)</Label>
              <Input 
                id="logo_url" 
                name="logo_url" 
                placeholder="https://..." 
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Tell us about the builder's track record..." 
                className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all p-4"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Builder Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
