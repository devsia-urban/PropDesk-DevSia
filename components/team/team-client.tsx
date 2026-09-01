'use client'

import React, { useState, useTransition } from "react"
import {
  UserPlus,
  Shield,
  Briefcase,
  Eye,
  MoreVertical,
  Mail,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Profile, UserRole, Agency } from "@/lib/types/database"
import { updateMemberRole, deactivateMember, removeMember } from "@/lib/actions/team"
import { formatRelativeTime } from "@/lib/utils/format"
import { RelativeTime } from "@/components/ui/relative-time"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { getAgency } from "@/lib/actions/agency"

import useSWR from "swr"
import { getTeamMembers } from "@/lib/actions/team"
import { Skeleton } from "@/components/ui/skeleton"

const ROLE_MAP: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  admin: { label: "Admin", color: "text-red-700", bg: "bg-red-50 border-red-100", icon: Shield, desc: "Full access + team management" },
  agent: { label: "Agent", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", icon: Briefcase, desc: "Add/edit properties and clients" },
  viewer: { label: "Viewer", color: "text-slate-600", bg: "bg-slate-50 border-slate-100", icon: Eye, desc: "Read-only monitoring" },
}

export function TeamClient({
  currentProfile,
  agency
}: {
  currentProfile: Profile
  agency: Agency
}) {
  const router = useRouter()
  const { isReadOnly } = useAuth()
  
  const { data, isLoading, error, mutate } = useSWR('team-members', () => getTeamMembers(1))
  
  const members = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = data?.totalPages || 0
  const currentPage = 1

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('agent')
  const [isPending, startTransition] = useTransition()

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("agent")
  const [isInviting, setIsInviting] = useState(false)

  const isAdmin = currentProfile.role === 'admin'

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) {
      toast.error("Read-Only Mode", { description: "Subscription paused. Renew to invite members." })
      return
    }
    if (!inviteEmail) return
    setIsInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, origin: window.location.origin }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to send invite")
      } else {
        toast.success(`Invite sent to ${inviteEmail}`, {
          description: `They'll receive an email to join as ${ROLE_MAP[inviteRole].label}.`
        })
        setIsInviteOpen(false)
        setInviteEmail("")
        setInviteRole("agent")
      }
    } catch {
      toast.error("Unexpected error sending invite")
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = () => {
    if (!selectedMember) return
    startTransition(async () => {
      const result = await updateMemberRole(selectedMember.id, newRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        mutate((prev: any) => prev ? { ...prev, data: prev.data.map((m: any) => m.id === selectedMember.id ? { ...m, role: newRole } : m) } : prev, { revalidate: false })
        toast.success(`${selectedMember.full_name}'s role updated to ${ROLE_MAP[newRole].label}`)
        setIsRoleOpen(false)
      }
    })
  }

  const handleDeactivate = (member: Profile) => {
    // Optimistic Update: Mark as inactive immediately
    mutate((prev: any) => prev ? { ...prev, data: prev.data.map((m: any) => m.id === member.id ? { ...m, is_active: false } : m) } : prev, { revalidate: false })

    startTransition(async () => {
      const result = await deactivateMember(member.id)
      if (result.error) {
        toast.error(result.error)
        mutate((prev: any) => prev ? { ...prev, data: prev.data.map((m: any) => m.id === member.id ? { ...m, is_active: true } : m) } : prev, { revalidate: false })
      } else {
        toast.info(`${member.full_name} has been deactivated`)
        router.refresh()
      }
    })
  }

  const handleResendInvite = async (member: Profile) => {
    try {
      toast.loading(`Resending invite to ${member.email}...`, { id: 'resend' })
      const res = await fetch('/api/team/resend-invite', {
        method: 'POST',
        body: JSON.stringify({ email: member.email })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to resend invite')
      }
      toast.success(`Invite resent to ${member.email}`, { id: 'resend' })
    } catch (err: any) {
      toast.error(err.message, { id: 'resend' })
    }
  }

  const handleRemove = (member: Profile) => {
    // Optimistic Update: Remove from list immediately
    const previousData = data
    mutate((prev: any) => prev ? { ...prev, data: prev.data.filter((m: any) => m.id !== member.id) } : prev, { revalidate: false })

    startTransition(async () => {
      const result = await removeMember(member.id)
      if (result.error) {
        toast.error(result.error)
        mutate(previousData, { revalidate: false })
      } else {
        toast.error(`${member.full_name} removed from team`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team</h1>
          <p className="text-sm text-slate-500 font-medium">
            {totalCount} member{totalCount !== 1 ? 's' : ''} in your agency
          </p>
        </div>

        {isAdmin && !isReadOnly && (
          totalCount >= (agency.max_users || 2) ? (
            <a
              href={`https://wa.me/917208850778?text=Hi, I want to add more members to my agency account (${agency.name}).`}
              target="_blank"
            >
              <Button className="bg-amber-500 hover:bg-amber-600 text-white border-none rounded-xl h-11 px-6 flex items-center gap-2 font-bold shadow-lg shadow-amber-100">
                <UserPlus className="w-4 h-4" />
                Buy more slots
              </Button>
            </a>
          ) : (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger render={
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl h-11 px-6 flex items-center gap-2 font-bold shadow-lg shadow-emerald-100">
                  <UserPlus className="w-4 h-4" />
                  Invite team member
                </Button>
              } />
              <DialogContent className="bg-white rounded-3xl max-w-md border-none ring-1 ring-slate-100 p-8">
                <DialogHeader className="space-y-3 pb-4">
                  <DialogTitle className="text-xl font-bold text-slate-900">Invite a team member</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    They'll receive a magic-link email to join your workspace.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        required type="email" placeholder="teammate@example.com"
                        value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-200 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                    <div className="space-y-2">
                      {(['agent', 'admin'] as const).map(r => {
                        const meta = ROLE_MAP[r]
                        const Icon = meta.icon
                        const selected = inviteRole === r
                        return (
                          <button key={r} type="button" onClick={() => setInviteRole(r)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                              selected ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-200" : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", selected ? "bg-emerald-500 text-white" : "bg-white text-slate-400 shadow-sm")}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-bold", selected ? "text-emerald-900" : "text-slate-800")}>{meta.label}</p>
                              <p className="text-[11px] font-medium text-slate-500">{meta.desc}</p>
                            </div>
                            {selected && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <DialogFooter className="pt-2 gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} className="h-12 rounded-xl font-bold text-slate-500 flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting || !inviteEmail} className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 flex-1">
                      {isInviting ? "Sending…" : "Send invite"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        )}
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(ROLE_MAP).map(([key, meta]) => {
          const Icon = meta.icon
          return (
            <Card key={key} className={cn("rounded-2xl border p-4 space-y-3 shadow-none", meta.bg)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 shadow-sm">
                <Icon className={cn("w-4 h-4", meta.color)} />
              </div>
              <div className="space-y-0.5">
                <h3 className={cn("text-sm font-bold", meta.color)}>{meta.label}</h3>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">{meta.desc}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Team Table */}
      <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-red-50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-500 text-center max-w-sm mb-6">Failed to fetch team members.</p>
            <Button variant="outline" onClick={() => mutate()}>Retry</Button>
          </div>
        ) : members.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No team members</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">Invite members to collaborate.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Member</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Role</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Joined</TableHead>
                {isAdmin && <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => {
                const isCurrentUser = member.id === currentProfile.id
                const meta = ROLE_MAP[member.role]
                const initials = member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <TableRow key={member.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("h-10 w-10 border", meta.bg)}>
                          <AvatarFallback className={cn("font-bold text-xs", meta.color)}>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 truncate">{member.full_name}</span>
                            {isCurrentUser && (
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter shrink-0">You</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 truncate">{member.email}</span>
                          {member.designation && <span className="text-[10px] text-slate-400 font-medium">{member.designation}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", meta.bg, meta.color)}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", member.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                        <span className="text-[11px] font-bold text-slate-600 tracking-tight capitalize">
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <RelativeTime
                        date={member.created_at}
                        className="text-xs font-bold text-slate-400 uppercase tracking-tight"
                      />
                    </TableCell>
                    {isAdmin && !isReadOnly && (
                      <TableCell className="py-4 text-right">
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="bg-white rounded-xl border-slate-100 shadow-xl w-48 p-2">
                              <DropdownMenuItem
                                className="text-xs font-bold text-slate-600 p-2.5 rounded-lg cursor-pointer"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setNewRole(member.role)
                                  setIsRoleOpen(true)
                                }}
                              >
                                Change role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs font-bold text-slate-600 p-2.5 rounded-lg cursor-pointer"
                                onClick={() => handleResendInvite(member)}
                              >
                                Resend Invite (Reset Pass)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs font-bold text-slate-600 p-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-700"
                                onClick={() => handleDeactivate(member)}
                              >
                                Deactivate
                              </DropdownMenuItem>
                              <div className="h-px bg-slate-50 my-1" />
                              <DropdownMenuItem
                                className="text-xs font-bold text-red-500 p-2.5 rounded-lg cursor-pointer"
                                onClick={() => handleRemove(member)}
                              >
                                Remove from team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', (currentPage - 1).toString())
              startTransition(() => router.push(`${window.location.pathname}?${params.toString()}`))
            }}
            className="rounded-lg font-bold"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 px-1">...</span>}
                  <Button
                    variant={currentPage === p ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0 rounded-lg font-bold",
                      currentPage === p ? "bg-slate-800" : "text-slate-500"
                    )}
                    disabled={isPending}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search)
                      params.set('page', p.toString())
                      startTransition(() => router.push(`${window.location.pathname}?${params.toString()}`))
                    }}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || isPending}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', (currentPage + 1).toString())
              startTransition(() => router.push(`${window.location.pathname}?${params.toString()}`))
            }}
            className="rounded-lg font-bold"
          >
            Next
          </Button>
        </div>
      )}

      {/* Change Role Dialog */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-md border-none ring-1 ring-slate-100 p-8">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl font-bold text-slate-900">Change role for {selectedMember?.full_name}</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-sm">
              Update their permissions across the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {(['admin', 'agent'] as const).map(r => {
              const meta = ROLE_MAP[r]
              const Icon = meta.icon
              const selected = newRole === r
              return (
                <button key={r} onClick={() => setNewRole(r)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                    selected ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/10" : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-emerald-500 text-white" : "bg-white text-slate-400 shadow-sm")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className={cn("text-sm font-bold", selected ? "text-emerald-900" : "text-slate-800")}>{meta.label}</p>
                    <p className="text-[11px] font-medium text-slate-500">{meta.desc}</p>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </button>
              )
            })}
          </div>
          <DialogFooter className="pt-8 gap-3">
            <Button variant="ghost" onClick={() => setIsRoleOpen(false)} className="h-12 rounded-xl font-bold text-slate-500 flex-1">Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={isPending} className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex-1">
              {isPending ? "Updating…" : "Update role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="text-center py-20">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-medium">No team members yet</p>
          {isAdmin && (
            <p className="text-xs text-slate-400 mt-1">Use the button above to invite your first member.</p>
          )}
        </div>
      )}
    </div>
  )
}
