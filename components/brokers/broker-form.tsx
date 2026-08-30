'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Phone, Mail, Building, MapPin, Star, Tag, Save, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Broker } from "@/lib/types/database"
import { createBroker, updateBroker } from "@/lib/actions/brokers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BrokerFormProps {
  initialData?: Broker
}

const COMMON_SPECIALTIES = [
  "Plots", "Luxury Apartments", "Villas", "Commercial Office",
  "Retail Space", "Industrial", "Agriculture Land", "Farmhouses",
  "Rentals", "Resale"
]

export function BrokerForm({ initialData }: BrokerFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || "",
    phones: initialData?.phones || [""],
    email: initialData?.email || "",
    company_name: initialData?.company_name || "",
    broker_type: initialData?.broker_type || "freelance",
    rating: initialData?.rating || 3,
    area: initialData?.area || "",
    specialties: initialData?.specialties || [],
    notes: initialData?.notes || "",
  })

  const [newSpecialty, setNewSpecialty] = useState("")

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones]
    newPhones[index] = value
    setFormData({ ...formData, phones: newPhones })
  }

  const addPhone = () => {
    setFormData({ ...formData, phones: [...formData.phones, ""] })
  }

  const removePhone = (index: number) => {
    if (formData.phones.length === 1) return
    const newPhones = formData.phones.filter((_, i) => i !== index)
    setFormData({ ...formData, phones: newPhones })
  }

  const toggleSpecialty = (specialty: string) => {
    if (formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== specialty)
      })
    } else {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      })
    }
  }

  const addCustomSpecialty = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSpecialty.trim()) {
      e.preventDefault()
      if (!formData.specialties.includes(newSpecialty.trim())) {
        setFormData({
          ...formData,
          specialties: [...formData.specialties, newSpecialty.trim()]
        })
      }
      setNewSpecialty("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Filter out empty phone strings
      const cleanedData = {
        ...formData,
        phones: formData.phones.filter(p => p.trim() !== "")
      }

      if (initialData) {
        const result = await updateBroker(initialData.id, cleanedData)
        if (result.error) throw new Error(result.error)
        toast.success("Broker updated successfully")
      } else {
        const result = await createBroker(cleanedData)
        if (result.error) throw new Error(result.error)
        toast.success("Broker created successfully")
      }
      router.push("/brokers")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-[1rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            Core Identity
          </h2>
          <p className="text-sm text-slate-500 mt-1">Basic contact and professional details</p>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
              <Input
                required
                placeholder="Broker's full name"
                className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email (Optional)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
              <Input
                type="email"
                placeholder="email@example.com"
                className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="text-sm font-bold text-slate-700 ml-1 flex items-center justify-between">
              Phone Numbers
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addPhone}
                className="text-[10px] cursor-pointer uppercase tracking-widest font-black text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <Plus className="w-3 h-3 mr-1" /> Add secondary phone
              </Button>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.phones.map((phone, index) => (
                <div key={index} className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      required={index === 0}
                      placeholder={index === 0 ? "Primary phone" : "Secondary phone"}
                      className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all"
                      value={phone}
                      onChange={e => handlePhoneChange(index, e.target.value)}
                    />
                  </div>
                  {formData.phones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(index)}
                      className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Professional Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">Specialties and operating regions</p>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Company / Agency Name</label>
            <div className="relative group">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="Brand or Agency name"
                className="pl-11 h-12 bg-slate-50  border-slate-200 rounded-2xl focus:bg-white transition-all"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Broker Type</label>
            <Select
              value={formData.broker_type}
              onValueChange={v => setFormData({ ...formData, broker_type: v as any })}
            >
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200 cursor-pointer rounded-2xl focus:bg-white transition-all">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white font-bold">
                <SelectItem className={"cursor-pointer"} value="freelance">Freelance Agent</SelectItem>
                <SelectItem className={"cursor-pointer"} value="agency">Agency Based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="">
            <label className="text-sm font-bold text-slate-700 ml-1">Core Area (Locality)</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="e.g. Vaishali Nagar, Mansarovar"
                className="pl-11 h-10 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all"
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1 flex items-center justify-between">
              Reliability Rating
              <Badge className="bg-amber-100 text-amber-700 border-none font-black">{formData.rating} Stars</Badge>
            </label>
            <div className="flex items-center gap-3 h-12 bg-slate-50 rounded-2xl px-4 border border-slate-200">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none cursor-pointer transition-transform active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      star <= formData.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-sm font-bold text-slate-700 ml-1">Specialties & Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECIALTIES.map(specialty => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={cn(
                    "px-4 py-2 rounded-xl cursor-pointer text-xs font-bold transition-all border-2",
                    formData.specialties.includes(specialty)
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                  )}
                >
                  {specialty}
                </button>
              ))}
            </div>

            <div className="relative group">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="Add custom specialty and press Enter..."
                className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all"
                value={newSpecialty}
                onChange={e => setNewSpecialty(e.target.value)}
                onKeyDown={addCustomSpecialty}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.specialties.filter(s => !COMMON_SPECIALTIES.includes(s)).map(specialty => (
                <Badge
                  key={specialty}
                  className="bg-slate-100 text-slate-700 border-none px-3 py-1.5 rounded-lg flex items-center gap-2"
                >
                  {specialty}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => toggleSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-slate-600" />
            Internal Notes
          </h2>
          <p className="text-sm text-slate-500 mt-1">Private details about your working relationship</p>
        </div>
        <div className="p-3">
          <Textarea
            placeholder="Write any specifics about lead sharing, commission terms, or reliability history..."
            className="min-h-[150px] bg-slate-50 border-slate-200 rounded-3xl p-6 focus:bg-white transition-all text-slate-700 font-medium"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-14 cursor-pointer px-8 rounded-xl border-2 border-slate-400 text-slate-600 font-bold hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-14 px-10 rounded-xl cursor-pointer bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isLoading ? "Saving..." : initialData ? "Update Broker" : "Create Broker"}
        </Button>
      </div>
    </form>
  )
}
