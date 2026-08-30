'use client'

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  UserCog,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Sparkles,
  Users,
  Building2,
  LayoutDashboard,
  Handshake,
  Shield,
  CalendarCheck,
  Layers, Briefcase,
} from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AuthProvider, useAuth } from "@/lib/context/auth-context"
import { LogoutButton } from "@/components/auth/logout-button"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { AnimatePresence, motion } from "framer-motion"
import { SubscriptionBanner } from "@/components/layout/subscription-banner"
import AICopilot from "@/components/AICopilot"

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Properties", icon: Building2, href: "/properties" },
  { label: "Schemes", icon: Layers, href: "/schemes" },
  { label: "Leads", icon: Users, href: "/clients" },
  { label: "Bookings", icon: CalendarCheck, href: "/bookings" },
  { label: "Smart Matches", icon: Sparkles, href: "/matches" },
  { label: "Brokers", icon: Handshake, href: "/brokers" },
  { label: "Associates", icon: Briefcase, href: "/associates" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  { label: "Team", icon: UserCog, href: "/team" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DashboardInner>{children}</DashboardInner>
      </NotificationProvider>
    </AuthProvider>
  )
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { profile, agency } = useAuth()

  // 🌍 Dynamic Favicon White-labeling
  React.useEffect(() => {
    if (agency?.logo_url) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
        ; (link as HTMLLinkElement).type = 'image/x-icon'
        ; (link as HTMLLinkElement).rel = 'shortcut icon'
        ; (link as HTMLLinkElement).href = agency.logo_url
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }, [agency?.logo_url])

  return (
    <div className="flex flex-col bg-slate-100 h-screen overflow-hidden print:h-auto print:overflow-visible text-stone-800 w-full">
      {/* Top Banner */}
      <SubscriptionBanner
        status={agency?.subscription_status || 'trial'}
        endDate={agency?.subscription_end_date || null}
        planType={agency?.plan_type || 'free'}
        isSuperAdmin={profile?.is_super_admin}
        isAdmin={profile?.role === 'admin'}
      />

      <div className="flex flex-1 overflow-hidden print:h-auto print:overflow-visible">
        {/* Desktop Sidebar */}
        <div className="print:hidden z-20">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Main Content - Updated with Motion Transitions */}
        <main className="flex-1 min-w-0 bg-slate-100 overflow-y-auto print:bg-white relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-4 px-2 md:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full print:p-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Nav */}
        <div className="print:hidden">
          <MobileNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[2.5rem] h-auto max-h-[92vh] px-0 pb-6 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
        >
          {/* Native-style drag handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

          <SheetHeader className="px-6 py-4 flex flex-row items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center overflow-hidden p-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={agency?.logo_url || "/DevSia.png"}
                alt="Logo"
                className="w-full h-full object-contain relative z-10 drop-shadow-sm"
              />
            </div>
            <div className="flex flex-col text-left justify-center">
              <SheetTitle className="text-xl font-bold tracking-tight text-slate-900">
                {agency?.name || "DevSia"}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500 font-medium">
                Real Estate Management
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="px-6 py-2 shrink-0">
            <Separator className="bg-slate-100" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
            {(profile?.is_super_admin
              ? [{ label: "Super Admin", icon: Shield, href: "/superadmin" }]
              : allNavItems.filter(item => {
                // Show items that are NOT in the bottom bar to avoid clutter
                const isBottomNavItem = ['/dashboard', '/properties', '/clients', '/bookings'].includes(item.href)
                if (isBottomNavItem) return false

                // Role-based filtering
                if (profile?.role === 'agent' && (item.label === 'Team' || item.label === 'Brokers')) return false

                return true
              })
            ).map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 group",
                    isActive
                      ? "bg-emerald-50/80 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-500/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                  )}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-100/80 text-slate-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-600 group-hover:scale-105 ring-1 ring-transparent group-hover:ring-slate-200/50"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-[15px] tracking-tight">{item.label}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActive
                      ? "text-emerald-500"
                      : "text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </Link>
              )
            })}
          </div>

          <div className="px-6 pt-2 pb-2 shrink-0">
            <Separator className="bg-slate-100 mb-4" />
            <LogoutButton className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-2xl h-auto font-semibold transition-all duration-300 active:scale-[0.98] group shadow-sm">
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-[15px]">Log out</span>
            </LogoutButton>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global AI Copilot */}
      {pathname !== '/subscription-expired' && <AICopilot role={profile?.role} />}
    </div>
  )
}