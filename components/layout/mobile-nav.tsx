'use client'

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  Sparkles,
  Layers,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/context/auth-context"
import { Shield } from "lucide-react"

const mobileNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Properties", icon: Building2, href: "/properties" },
  { label: "Schemes", icon: Layers, href: "/schemes" },
  { label: "Leads", icon: Users, href: "/clients" },
]

interface MobileNavProps {
  onOpenMenu: () => void
}

export function MobileNav({ onOpenMenu }: MobileNavProps) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const isSuperAdmin = profile?.is_super_admin

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-40 px-2">
      {isSuperAdmin ? (
        <Link
          href="/superadmin"
          className={cn(
            "flex flex-col items-center justify-center flex-1 gap-1 transition-colors h-full",
            pathname === "/superadmin" ? "text-emerald-500" : "text-slate-400"
          )}
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-medium">Super Admin</span>
        </Link>
      ) : (
        mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-colors h-full",
                isActive ? "text-emerald-500" : "text-slate-400"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })
      )}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 gap-1 text-slate-400 hover:text-emerald-500 transition-colors h-full"
      >
        <Menu className="w-6 h-6" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  )
}
