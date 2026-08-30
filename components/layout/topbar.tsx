import { Bell, Menu, Search, User } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/properties": "Properties",
  "/clients": "Clients",
  "/matches": "Smart Matches",
  "/notifications": "Notifications",
  "/team": "Team Management",
  "/settings": "Settings",
}

interface TopbarProps {
  onOpenMobileMenu: () => void
}

import { useAuth } from "@/lib/context/auth-context"
import { LogoutButton } from "@/components/auth/logout-button"
import { useNotifications } from "@/components/notifications/notification-provider"

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname()
  const { profile, user } = useAuth()
  const { unreadCount } = useNotifications()
  const title = routeTitles[pathname] || "DevSia"
  
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <header className="h-[60px] bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onOpenMobileMenu}
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </Button>
        <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end max-w-sm md:max-w-md ml-4">
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-emerald-600 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-in zoom-in-50 duration-200">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 bg-slate-200 rounded-full border-2 border-white" />
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" />}>
              <Avatar className="h-9 w-9 border-2 border-slate-50">
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" render={<Link href="/settings">Profile</Link>} />
              <DropdownMenuItem className="cursor-pointer" render={<Link href="/settings">Settings</Link>} />
              <DropdownMenuSeparator />
              <LogoutButton variant="ghost" className="w-full text-red-600 focus:text-red-700 hover:text-red-700 hover:bg-red-50 justify-start h-9 px-2">
                Log out
              </LogoutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
