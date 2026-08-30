export const dynamic = "force-dynamic";
import React from "react"
import { ShieldAlert, Phone, CreditCard, ExternalLink } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-stone-800">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 text-center space-y-8 border border-slate-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Access Locked</h1>
          <p className="text-slate-500 font-medium">Your DevSia subscription has expired or has been stopped. To continue using the platform, please settle the pending dues.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <a
            href="https://wa.me/918271301911?text=Help%21%20My%20DevSia%20subscription%20has%20expired."
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none h-14 font-bold rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            )}
          >
            <Phone className="w-5 h-5" />
            Contact Developer
          </a>

          <Link
            href="https://theDevSia.in/pricing"
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-slate-200 text-slate-600 h-14 font-bold rounded-2xl hover:bg-slate-50 flex items-center justify-center gap-2"
            )}
          >
            <CreditCard className="w-5 h-5" />
            View Pricing Plans
            <ExternalLink className="w-4 h-4 text-slate-300" />
          </Link>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm text-slate-400 font-medium">
          Note: Your data is safe and secured. Access will be restored immediately upon payment confirmation.
        </div>

        <div className="pt-4">
          <LogoutButton className="text-slate-400 hover:text-slate-600 text-sm font-bold underline underline-offset-4">
            Switch Account
          </LogoutButton>
        </div>
      </div>
    </div>
  )
}
