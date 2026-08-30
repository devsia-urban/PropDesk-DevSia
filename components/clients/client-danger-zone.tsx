'use client'

import React, { useState } from "react"
import { AlertTriangle, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteClient, updateClientStatus } from "@/lib/actions/clients"

interface ClientDangerZoneProps {
  clientId: string
  clientName: string
  clientStatus?: string
}

export function ClientDangerZone({ clientId, clientName, clientStatus }: ClientDangerZoneProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleToggleStatus = async () => {
    setIsClosing(true)
    const newStatus = clientStatus === 'closed' ? 'active' : 'closed'
    const { error } = await updateClientStatus(clientId, newStatus)
    setIsClosing(false)

    if (error) {
      toast.error(error)
      return
    }

    if (newStatus === 'closed') {
      toast.success("Client marked as closed", {
        description: `${clientName}'s requirement has been archived.`
      })
    } else {
      toast.success("Client marked as active", {
        description: `${clientName}'s requirement is now active again.`
      })
    }
    router.refresh()
  }

  const handleDeleteClient = async () => {
    setIsDeleting(true)
    const { error } = await deleteClient(clientId)
    setIsDeleting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.error("Client deleted permanently")
    router.push('/clients')
    router.refresh()
  }

  return (
    <Card className="border-l-4 border-red-400 border-t-slate-100 border-r-slate-100 border-b-slate-100 shadow-sm rounded-2xl p-6 bg-red-50/20">
      <div className="flex items-center gap-2 mb-4 text-red-600">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="font-bold tracking-tight">Danger zone</h3>
      </div>

      <div className="space-y-4">
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border",
          clientStatus === 'closed' ? "bg-slate-50 border-slate-200" : "bg-white border-red-100"
        )}>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {clientStatus === 'closed' ? 'Mark client as active' : 'Mark client as closed'}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {clientStatus === 'closed' 
                ? 'Use this if the client is looking for properties again.' 
                : 'Use this if the client has bought/rented or is no longer looking.'}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger render={
              <Button variant="outline" className={cn(
                "w-full sm:w-auto font-bold rounded-lg h-9",
                clientStatus === 'closed'
                  ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  : "border-red-100 text-red-600 hover:bg-red-50"
              )}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {clientStatus === 'closed' ? 'Activate lead' : 'Close lead'}
              </Button>
            } />
            <AlertDialogContent className="bg-white rounded-2xl max-w-[400px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-bold">
                  {clientStatus === 'closed' ? 'Reactivate this requirement?' : 'Close this requirement?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 pt-1">
                  {clientStatus === 'closed'
                    ? `This will restore ${clientName}'s requirements. They will appear in active matches again.`
                    : `This will archive ${clientName}'s requirements. They will no longer appear in active matches.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-3 pt-4">
                <AlertDialogCancel className="flex-1 border-slate-200 rounded-xl font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(
                    "flex-1 text-white border-none rounded-xl font-bold flex items-center justify-center gap-2",
                    clientStatus === 'closed' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                  )}
                  onClick={handleToggleStatus}
                  disabled={isClosing}
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {clientStatus === 'closed' ? 'Activating...' : 'Closing...'}
                    </>
                  ) : (
                    clientStatus === 'closed' ? 'Yes, activate' : 'Yes, close'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-red-100 shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-900">Delete client permanently</p>
            <p className="text-xs text-slate-500 font-medium">This action is irreversible and deletes all history.</p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger render={
              <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 cursor-pointer text-white border-none font-bold rounded-lg h-9">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete permanently
              </Button>
            } />
            <AlertDialogContent className="bg-white rounded-2xl max-w-[400px]">
              <AlertDialogHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogTitle className="font-bold text-center text-red-600">Irreversible Action</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-center pt-1 font-medium italic">
                  "This will permanently delete {clientName} and all associated match data. This cannot be undone."
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col gap-2 pt-4">
                <AlertDialogAction
                  className="w-full bg-red-600 cursor-pointer hover:bg-red-700 text-white border-none rounded-xl font-bold h-11 flex items-center justify-center gap-2"
                  onClick={handleDeleteClient}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete permanently"
                  )}
                </AlertDialogAction>
                <AlertDialogCancel className="w-full border-slate-200 rounded-xl font-bold h-11">
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}
