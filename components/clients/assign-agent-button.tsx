'use client'

import React, { useState, useEffect } from 'react'
import { UserCheck, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getTeamMembers, updateClient } from '@/lib/actions/clients'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AssignAgentButtonProps {
  clientId: string
  currentAssigneeId?: string | null
  currentAssigneeName?: string | null
}

export function AssignAgentButton({ clientId, currentAssigneeId, currentAssigneeName }: AssignAgentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [team, setTeam] = useState<{ id: string; full_name: string; role: string }[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && team.length === 0) {
      getTeamMembers().then(setTeam)
    }
  }, [isOpen])

  const handleAssign = async (agentId: string, agentName: string) => {
    if (agentId === currentAssigneeId) return
    
    setLoading(true)
    try {
      const { error } = await updateClient(clientId, { assigned_to: agentId })
      if (error) {
        toast.error(error)
      } else {
        toast.success(`Lead assigned to ${agentName}`)
        router.refresh()
      }
    } catch (err) {
      toast.error("Failed to assign agent")
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger render={
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          className="h-10 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          ) : (
            <UserCheck className="w-4 h-4 text-emerald-500" />
          )}
          {currentAssigneeName || "Assign Agent"}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-56 bg-white rounded-2xl shadow-xl border-slate-100 p-2">
        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">
          Select Team Member
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[300px] overflow-y-auto">
          {team.map((member) => (
            <DropdownMenuItem
              key={member.id}
              onClick={() => handleAssign(member.id, member.full_name)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors",
                member.id === currentAssigneeId ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">
                  {member.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{member.full_name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{member.role}</span>
              </div>
            </DropdownMenuItem>
          ))}
          {team.length === 0 && (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-200" />
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper to keep component file clean
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
