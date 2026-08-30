'use client'

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  Bell,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Handshake,
  CalendarCheck,
  Layers,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Properties", icon: Building2, href: "/properties" },
  { label: "Schemes", icon: Layers, href: "/schemes" },
  { label: "Leads", icon: Users, href: "/clients" },
  { label: "Bookings", icon: CalendarCheck, href: "/bookings" },
  { label: "Smart Matches", icon: Sparkles, href: "/matches" },
  { label: "Brokers", icon: Handshake, href: "/brokers" },
  { label: "Associates", icon: Briefcase, href: "/associates" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
]

const secondaryNavItems = [
  { label: "Team", icon: UserCog, href: "/team" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

import { Shield, Target } from "lucide-react"

const adminNavItems = [
  { label: "Agencies", icon: Shield, href: "/superadmin" },
  { label: "Sales CRM", icon: Target, href: "/superadmin/leads" },
]

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

import { useAuth } from "@/lib/context/auth-context"
import { LogoutButton } from "@/components/auth/logout-button"

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { profile, agency, isLoading } = useAuth()
  const isSuperAdmin = profile?.is_super_admin

  const initials = profile?.full_name
    ? profile.full_name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : isLoading ? ".." : "U"

  const [imgSrc, setImgSrc] = React.useState("/dev-sia.png")
  const [cachedName, setCachedName] = React.useState("DevSia")
  const [cachedUserName, setCachedUserName] = React.useState("My Account")
  const [cachedRole, setCachedRole] = React.useState("AGENT")

  // 🏎️ Local Branding & Profile Cache for Instant Load
  React.useEffect(() => {
    const savedLogo = localStorage.getItem('agency_logo')
    const savedName = localStorage.getItem('agency_name')
    const savedUserName = localStorage.getItem('user_full_name')
    const savedRole = localStorage.getItem('user_role')

    if (savedLogo) setImgSrc(savedLogo)
    if (savedName) setCachedName(savedName)
    if (savedUserName) setCachedUserName(savedUserName)
    if (savedRole) setCachedRole(savedRole)
  }, [])

  React.useEffect(() => {
    if (agency?.logo_url) {
      setImgSrc(agency.logo_url)
      localStorage.setItem('agency_logo', agency.logo_url)
    }
    if (agency?.name) {
      setCachedName(agency.name)
      localStorage.setItem('agency_name', agency.name)
    }
    if (profile?.full_name) {
      setCachedUserName(profile.full_name)
      localStorage.setItem('user_full_name', profile.full_name)
    }
    if (profile?.role) {
      const roleText = isSuperAdmin ? "SUPER ADMIN" : profile.role.toUpperCase()
      setCachedRole(roleText)
      localStorage.setItem('user_role', roleText)
    }
  }, [agency?.logo_url, agency?.name, profile?.full_name, profile?.role, isSuperAdmin])

  const userRole = isLoading && !profile ? cachedRole : (isSuperAdmin ? "SUPER ADMIN" : (profile?.role?.toUpperCase() || cachedRole))
  const displayUserName = isLoading && !profile ? cachedUserName : (profile?.full_name || cachedUserName)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-slate-900 text-slate-400 transition-all duration-300 ease-in-out border-r border-slate-800 shrink-0",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="h-[70px] flex items-center px-4 shrink-0 overflow-hidden">
        <Link href={isSuperAdmin ? "/superadmin" : "/dashboard"} className="flex items-center gap-3 w-full">
          <div className={cn(
            "flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 shadow-lg shadow-slate-950/20",
            " h-13 relative shrink-0",
            isLoading && "animate-pulse bg-slate-800"
          )}>
            <img
              src={imgSrc}
              alt="Logo"
              className={cn(
                "w-full h-full rounded-xl object-contain p-1.5 transition-opacity duration-500",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onError={() => setImgSrc("/dev-sia.png")}
            />
          </div>

        </Link>
      </div>

      <Separator className="bg-slate-800" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollremove overflow-x-hidden py-2">
        {isSuperAdmin ? (
          <>
            {adminNavItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}
          </>
        ) : (
          <>
            {navItems
              .filter(item => {
                if (profile?.role === 'agent' && item.label === 'Brokers') return false
                if (item.label === 'Associates') {
                  const checkRole = profile?.role || cachedRole?.toLowerCase();
                  if (checkRole !== 'admin') return false
                }
                return true
              })
              .map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href}
                />
              ))}


            {secondaryNavItems
              .filter(item => {
                if (profile?.role === 'agent' && item.label === 'Team') return false
                return true
              })
              .map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href}
                />
              ))}
          </>
        )}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-slate-800 space-y-4">
        <div className={cn(
          "flex items-center gap-3 group relative transition-all duration-300",
          isCollapsed ? "justify-center" : "px-2 pb-2"
        )}>
          <Avatar className="w-8 h-8 border-2 border-emerald-500/20 cursor-pointer shadow-md">
            <AvatarFallback className="bg-emerald-600 text-white text-[10px] font-black">{initials}</AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in slide-in-from-left-2 duration-300">
              <p className="text-sm font-semibold text-slate-100 truncate leading-none mb-1.5">
                {displayUserName || profile?.email || 'User'}
              </p>
              <p className="text-[10px] font-black text-slate-500 truncate uppercase tracking-widest">
                {userRole}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <LogoutButton className="p-1.5 h-auto w-auto rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </LogoutButton>
          )}

          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {profile?.full_name || 'User'} · {userRole}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full h-10 hover:bg-slate-800 hover:text-white text-slate-500"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <div className="flex items-center gap-2 px-2 w-full">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Collapse</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ item, isCollapsed, isActive }: {
  item: typeof navItems[0],
  isCollapsed: boolean,
  isActive: boolean
}) {
  const { icon: Icon, label, href } = item

  const content = (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        "flex items-center h-10 transition-all duration-200 group mx-3 rounded-lg relative",
        isActive
          ? "bg-emerald-500/10 text-emerald-400 font-medium"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
        isCollapsed ? "justify-center px-2 mx-3" : "px-3"
      )}
    >
      {isActive && !isCollapsed && (
        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full" />
      )}

      <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-emerald-400")} />

      {!isCollapsed && (
        <span className="ml-3 text-sm flex-1 truncate transition-all duration-300">
          {label}
        </span>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-800  text-white border-slate-700">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}
