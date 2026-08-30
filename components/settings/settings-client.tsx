'use client'

import React, { useState, useTransition } from "react"
import {
  User,
  Building2,
  Lock,
  Bell,
  Globe,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Laptop,
  Smartphone,
  Shield,
  BellRing,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { useNotifications } from "@/components/notifications/notification-provider"
import { Profile, Agency } from "@/lib/types/database"
import { updateProfile, updateAgency } from "@/lib/actions/settings"
import { createClient } from "@/lib/supabase/client"
import { BrandingSettings } from "@/components/settings/branding-settings"

const profileSchema = z.object({
  full_name: z.string().min(2, "Name is too short"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  rera_number: z.string().optional(),
})

const agencySchema = z.object({
  name: z.string().min(2, "Agency name is too short"),
  website: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === "") return true
      try {
        // Accept bare domains like example.com or full URLs
        const withProtocol = val.startsWith("http") ? val : `https://${val}`
        new URL(withProtocol)
        return true
      } catch {
        return false
      }
    }, "Enter a valid website (e.g. example.com)"),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string()
    .optional()
    .refine(val => !val || val.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Enter a valid email"),
  rera_number: z.string().optional(),
})

type TabType = "Profile" | "Agency" | "Notifications" | "Security"

interface SettingsClientProps {
  initialProfile: Profile
  initialAgency: Agency | null
}

export function SettingsClient({ initialProfile, initialAgency }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Profile")
  const [isPending, startTransition] = useTransition()
  const isAdmin = initialProfile.role === "admin"

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile.full_name,
      phone: initialProfile.phone ?? "",
      designation: initialProfile.designation ?? "",
      rera_number: initialProfile.rera_number ?? "",
    },
  })

  const agencyForm = useForm<z.infer<typeof agencySchema>>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: initialAgency?.name ?? "",
      website: initialAgency?.website ?? "",
      address: initialAgency?.address ?? "",
      contact_phone: initialAgency?.contact_phone ?? "",
      contact_email: initialAgency?.contact_email ?? "",
      rera_number: initialAgency?.rera_number ?? "",
    },
  })

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    startTransition(async () => {
      const result = await updateProfile(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated")
        profileForm.reset(data)
      }
    })
  }

  const onAgencySubmit = (data: z.infer<typeof agencySchema>) => {
    startTransition(async () => {
      const result = await updateAgency(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Agency information saved")
        agencyForm.reset(data)
      }
    })
  }

  const TABS = [
    { id: "Profile" as TabType, label: "Profile", icon: User, dirty: profileForm.formState.isDirty },
    ...(isAdmin ? [{ id: "Agency" as TabType, label: "Agency", icon: Building2, dirty: agencyForm.formState.isDirty }] : []),
    { id: "Security" as TabType, label: "Security", icon: Lock, dirty: false },
    { id: "Notifications" as TabType, label: "Notifications", icon: Bell, dirty: false },
  ]

  const initials = initialProfile.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "text-[10px] font-bold px-2 py-0.5 border capitalize",
            initialProfile.role === 'admin' ? "bg-red-50 border-red-100 text-red-700" :
            initialProfile.role === 'agent' ? "bg-blue-50 border-blue-100 text-blue-700" :
            "bg-slate-50 border-slate-100 text-slate-600"
          )}>
            {initialProfile.role}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar tabs */}
        <aside className="w-full md:w-48 lg:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative shrink-0",
                    isActive ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-500" : "text-slate-400")} />
                  {tab.label}
                  {tab.dirty && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            {activeTab === "Profile" && (
              <Card className="p-6 border-slate-100 shadow-sm rounded-3xl bg-white space-y-8">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-2 border-slate-100 ring-4 ring-slate-50">
                    <AvatarFallback className="text-xl font-bold bg-emerald-50 text-emerald-600">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900">{initialProfile.full_name}</p>
                    <p className="text-sm text-slate-500">{initialProfile.email}</p>
                    <p className="text-[10px] text-slate-400 capitalize font-bold tracking-widest">{initialProfile.role}</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full name</Label>
                      <Input {...profileForm.register("full_name")} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium" />
                      {profileForm.formState.errors.full_name && <p className="text-[10px] text-red-500 font-bold ml-1">{profileForm.formState.errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</Label>
                      <Input value={initialProfile.email} disabled className="h-12 rounded-xl bg-slate-50/50 border-transparent font-medium text-slate-400 cursor-not-allowed" />
                      <p className="text-[9px] text-slate-400 ml-1">Email cannot be changed here</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input {...profileForm.register("phone")} className="pl-10 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Designation / Title</Label>
                      <Input {...profileForm.register("designation")} placeholder="e.g. Senior Property Consultant" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RERA Number</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input {...profileForm.register("rera_number")} placeholder="Your RERA license number" className="pl-10 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium" />
                      </div>
                      <p className="text-[9px] text-slate-400 ml-1">Used in booking forms and official documents</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={!profileForm.formState.isDirty || isPending}
                      className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none"
                    >
                      {isPending ? "Saving…" : "Save profile"}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === "Agency" && isAdmin && initialAgency && (
              <BrandingSettings agency={initialAgency} />
            )}

            {activeTab === "Agency" && !isAdmin && (
              <Card className="p-10 border-slate-100 shadow-sm rounded-3xl bg-white text-center space-y-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Admin access required</h3>
                  <p className="text-sm text-slate-500 mt-1">Only agency admins can view and edit agency settings.</p>
                </div>
              </Card>
            )}

            {activeTab === "Security" && (
              <SecurityTab />
            )}

            {activeTab === "Notifications" && (
              <NotificationsTab />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function SecurityTab() {
  const supabase = createClient()
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [strength, setStrength] = useState(0)
  const [isPending, startTransition] = useTransition()

  React.useEffect(() => {
    let s = 0
    if (newPwd.length > 5) s = 1
    if (newPwd.length > 8) s = 2
    if (/[A-Z]/.test(newPwd) && /\d/.test(newPwd)) s = 3
    if (/[^A-Za-z0-9]/.test(newPwd)) s = 4
    setStrength(s)
  }, [newPwd])

  const strengthColor = ["bg-slate-200", "bg-red-500", "bg-orange-400", "bg-amber-400", "bg-emerald-500"]
  const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"]

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      toast.error("Passwords don't match")
      return
    }
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Password updated successfully")
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
      }
    })
  }

  return (
    <Card className="p-6 border-slate-100 shadow-sm rounded-3xl bg-white space-y-8">
      <form onSubmit={handleChangePassword} className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Change password</h3>
        <div className="space-y-2 max-w-sm">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New password</Label>
          <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 transition-all font-medium" />
          {newPwd && (
            <div className="space-y-1.5 px-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={cn("flex-1 rounded-full bg-slate-100", i <= strength ? strengthColor[strength] : "")} />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-bold uppercase", strength < 4 ? "text-amber-500" : "text-emerald-500")}>{strengthLabels[strength]}</span>
                {strength === 4 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2 max-w-sm">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm new password</Label>
          <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 transition-all font-medium" />
        </div>
        <Button type="submit" disabled={!newPwd || isPending} className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black font-bold text-white disabled:opacity-50">
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>

      <div className="pt-8 border-t border-slate-50 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Active sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Current browser</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] font-medium text-slate-500">Current session</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function NotificationsTab() {
  const { subscribeToPush, isSubscribed } = useNotifications()

  return (
    <Card className="p-6 border-slate-100 shadow-sm rounded-3xl bg-white space-y-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group flex items-center gap-2">
              <BellRing className="w-4 h-4 text-emerald-500" />
              Browser Notifications
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
              Get real-time alerts on your phone and laptop for follow-ups and team activity even when the app is closed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed ? (
               <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full">
                 Active
               </Badge>
            ) : (
              <Button 
                onClick={subscribeToPush}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-emerald-100"
              >
                Enable Notifications
              </Button>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Alert Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Team Activity</p>
                <p className="text-[11px] font-medium text-slate-500">Notify me when agents create or delete properties</p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Daily Reminders</p>
                <p className="text-[11px] font-medium text-slate-500">Scheduled summary of today's follow-ups at 9 AM</p>
              </div>
              <Switch checked={true} disabled />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
