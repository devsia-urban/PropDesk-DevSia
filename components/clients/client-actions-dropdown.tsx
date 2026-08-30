'use client'

import React, { useState } from "react"
import { MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteClient, updateClientStatus } from "@/lib/actions/clients"

interface ClientActionsDropdownProps {
  clientId: string
  clientName: string
  clientStatus?: string
}

export function ClientActionsDropdown({ clientId, clientName, clientStatus }: ClientActionsDropdownProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = async () => {
    const newStatus = clientStatus === 'closed' ? 'active' : 'closed'
    const { error } = await updateClientStatus(clientId, newStatus)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(newStatus === 'closed' ? "Client marked as closed" : "Client marked as active")
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${clientName}?`)) return
    
    setIsDeleting(true)
    const { error } = await deleteClient(clientId)
    setIsDeleting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Client deleted")
    router.push('/clients')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 border border-slate-100 rounded-xl">
          <MoreVertical className="w-5 h-5" />
        </Button>
      } />
      <DropdownMenuContent align="end" className="bg-white min-w-[160px]">
        <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer font-medium">
          {clientStatus === 'closed' ? 'Mark as active' : 'Mark as closed'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-500 cursor-pointer font-medium focus:text-red-500">Delete client</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
