'use client'

import React from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintButton() {
  return (
    <Button 
      variant="ghost" 
      className="w-full text-slate-500 hover:text-slate-900 h-10 rounded-xl no-print"
      onClick={() => window.print()}
    >
      <Download className="w-4 h-4 mr-2" />
      Download details
    </Button>
  )
}

