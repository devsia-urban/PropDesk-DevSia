'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Loader2, Share2 } from "lucide-react"
import { SharePropertyModal } from "@/components/brokers/share-property-modal"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { updatePropertyStatus, deleteProperty } from "@/lib/actions/properties"

interface PropertyDetailActionsProps {
  propertyId: string
  propertyName: string
  currentStatus: string
}

export function PropertyDetailActions({ propertyId, propertyName, currentStatus }: PropertyDetailActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleStatusChange = async (newStatus: "sold" | "rented" | "available" | "hold" | "booked") => {
    if (newStatus === currentStatus) return

    setIsUpdatingStatus(true)
    try {
      const result = await updatePropertyStatus(propertyId, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Property marked as ${newStatus}`)
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProperty(propertyId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Property deleted successfully")
        router.push("/properties")
      }
    } catch (error) {
      toast.error("Failed to delete property")
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-400" disabled>
        <MoreVertical className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-400" disabled={isUpdatingStatus || isDeleting}>
            {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
          </Button>
        } />
        <DropdownMenuContent align="end" className="bg-white min-w-48 p-1">
          {currentStatus !== "available" && (
            <DropdownMenuItem className="text-slate-600 cursor-pointer rounded-md focus:bg-slate-50 focus:text-slate-900" onClick={() => handleStatusChange("available")}>
              Mark as Available
            </DropdownMenuItem>
          )}
          {currentStatus !== "sold" && (
            <DropdownMenuItem className="text-slate-600 cursor-pointer rounded-md focus:bg-slate-50 focus:text-slate-900" onClick={() => handleStatusChange("sold")}>
              Mark as Sold
            </DropdownMenuItem>
          )}
          {currentStatus !== "rented" && (
            <DropdownMenuItem className="text-slate-600 cursor-pointer rounded-md focus:bg-slate-50 focus:text-slate-900" onClick={() => handleStatusChange("rented")}>
              Mark as Rented
            </DropdownMenuItem>
          )}
          {currentStatus !== "hold" && (
            <DropdownMenuItem className="text-slate-600 cursor-pointer rounded-md focus:bg-slate-50 focus:text-slate-900" onClick={() => handleStatusChange("hold")}>
              Mark as Hold
            </DropdownMenuItem>
          )}
          {currentStatus !== "booked" && (
            <DropdownMenuItem className="text-slate-600 cursor-pointer rounded-md focus:bg-slate-50 focus:text-slate-900" onClick={() => handleStatusChange("booked")}>
              Mark as Booked
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          <DropdownMenuItem
            className="text-amber-600 cursor-pointer rounded-md focus:bg-amber-500 focus:text-white font-bold flex items-center gap-2"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4" /> Share with Broker
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          <DropdownMenuItem className="text-red-600 cursor-pointer rounded-md focus:bg-red-50 focus:text-red-700" onClick={() => setShowDeleteAlert(true)}>
            Delete Property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. This will permanently delete the property from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SharePropertyModal
        propertyId={propertyId}
        propertyName={propertyName}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  )
}
