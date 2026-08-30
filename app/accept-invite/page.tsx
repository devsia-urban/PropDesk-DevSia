'use client'

import React, { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Eye, EyeOff, Loader2, ShieldCheck, Mail, Building2 } from "lucide-react"
import { type AuthChangeEvent, type Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function AcceptInvitePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<"loading" | "form" | "done" | "error" | "syncing">("loading")
  const [sessionUser, setSessionUser] = useState<{ email: string; agency_id?: string; role?: string } | null>(null)
  const [agencyData, setAgencyData] = useState<{ name: string; logo_url: string | null } | null>(null)

  const fetchAgency = useCallback(async (id: string) => {
    if (!id) return
    const { data } = await supabase.from('agencies').select('name, logo_url').eq('id', id).single()
    if (data) setAgencyData(data)
  }, [supabase])

  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [strength, setStrength] = useState(0)

  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-400", "bg-amber-400", "bg-emerald-500"]
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong ✓"]

  useEffect(() => {
    let s = 0
    if (password.length > 5) s = 1
    if (password.length > 8) s = 2
    if (/[A-Z]/.test(password) && /\d/.test(password)) s = 3
    if (/[^A-Za-z0-9]/.test(password)) s = 4
    setStrength(s)
  }, [password])

  const handleAuthChange = useCallback((user: any) => {
    if (!user) return
    const agencyId = user.user_metadata?.agency_id
    setSessionUser({
      email: user.email!,
      agency_id: agencyId,
      role: user.user_metadata?.role ?? 'admin',
    })
    if (agencyId) fetchAgency(agencyId)
    if (user.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name)
    }
    setStep('form')
  }, [fetchAgency])

  useEffect(() => {
    // 1. Hash Parser for Manual Links (#email=...&invite=...) and Official Invites
    const parseHash = () => {
      const hash = window.location.hash.substring(1)
      if (!hash) return null

      const params = new URLSearchParams(hash)

      // Manual Link Detection
      const email = params.get('email')
      const invite = params.get('invite')
      if (email && invite) return { type: 'manual', email, invite }

      // Official Link Detection
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken || type === 'invite' || type === 'recovery') {
        return {
          type: 'official',
          accessToken: accessToken || undefined,
          refreshToken: refreshToken || undefined
        }
      }

      return null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // // console.log('Auth event change:', event, session?.user?.email)
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          handleAuthChange(session.user)
        }
      }
    )

    const checkSession = async () => {
      // // console.log('Checking session...')

      // 1. Detect Syncing State from Hash
      if (window.location.hash.includes('syncing=true')) {
        setStep('syncing')
        
        // Fire a fix immediately before polling starts
        fetch('/api/team/fix-profile', { method: 'POST' }).catch(console.error)
        
        const retryInterval = setInterval(async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
            if (profile) {
              clearInterval(retryInterval)
              router.push('/dashboard')
              router.refresh()
            }
          }
        }, 2000)
        return () => clearInterval(retryInterval)
      }

      const hashInfo = parseHash()
      // // console.log('Hash detected:', hashInfo?.type)

      // 2. Nuclear Option: Force Session if Official Hash is present
      if (hashInfo?.type === 'official' && hashInfo.accessToken) {
        // // console.log('Nuclear: Manually setting session...')
        await supabase.auth.setSession({
          access_token: hashInfo.accessToken,
          refresh_token: hashInfo.refreshToken || ''
        })
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        handleAuthChange(session.user)
      } else {
        if (hashInfo?.type === 'manual') {
          setSessionUser({ email: hashInfo.email!, agency_id: hashInfo.invite, role: 'admin' })
          if (hashInfo.invite) fetchAgency(hashInfo.invite)
          setStep('form')
        } else if (hashInfo?.type === 'official') {
          console.log('Waiting for official session establishment...')
          // We stay in loading, the listener or setSession will soon update the state
        } else if (!window.location.hash) {
          // console.log('No hash, setting error...')
          const t = setTimeout(() => {
            setStep(prev => prev === 'loading' ? 'error' : prev)
          }, 3000)
          return () => clearTimeout(t)
        }
      }
    }

    checkSession()

    // Increased timeout for official links (Functional update to avoid closure capture)
    const timeout = setTimeout(() => {
      setStep(prev => {
        if (prev === 'loading') {
          console.error('Accept invite timeout reached (20s)')
          return 'error'
        }
        return prev
      })
    }, 20000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase, handleAuthChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error("Please enter your full name"); return }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (password !== confirmPwd) { toast.error("Passwords don't match"); return }

    startTransition(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // A. Official Flow (Updating existing temp user)
          const { error: pwdError } = await supabase.auth.updateUser({
            password,
            data: { full_name: fullName }
          })
          if (pwdError) throw pwdError
        } else {
          // B. Manual Flow (Creating new account)
          const { error: signUpError } = await supabase.auth.signUp({
            email: sessionUser?.email!,
            password,
            options: {
              data: {
                full_name: fullName,
                agency_id: sessionUser?.agency_id,
                role: 'admin'
              }
            }
          })
          if (signUpError) throw signUpError
        }

        window.location.hash = ''
        setStep("done")
        
        // AUTO-FIX: Guarantee profile exists before redirecting to dashboard
        try {
          await fetch('/api/team/fix-profile', { method: 'POST' })
        } catch (e) {
          console.error('Auto-fix failed', e)
        }

        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000)
      } catch (err: any) {
        toast.error(err.message || "Something went wrong. Please try again.")
      }
    })
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-xl font-black text-slate-900">Verifying Invite</h2>
          <p className="text-slate-500 font-medium">Please wait while we secure your connection...</p>
        </div>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Link Expired or Invalid</h2>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            This invitation link has either expired or was already used. Please request a new invite from your administrator.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="h-12 rounded-xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Sign In
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === "syncing") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl border-none p-12 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Preparing your workspace...</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              We're setting things up for you. This usually takes just a few seconds. 🥂
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl border-none p-12 max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-200 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h2>
            <p className="text-slate-500 font-medium">Welcome aboard, <span className="text-emerald-600 font-bold">{fullName}</span>. Your workspace is ready.</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-300">Entering Dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img src={agencyData?.logo_url || "/dev-sia.png"} alt="Logo" className="h-16 w-auto object-contain bg-white rounded-2xl shadow-xl border border-slate-50 p-2" />
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {agencyData?.name ? `Join ${agencyData.name}` : ""}
            </h1>
            <p className="text-emerald-600 font-bold text-sm">Secure Agency Onboarding</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />

          <div className="text-center space-y-3">
            <h2 className="text-xl font-extrabold text-slate-800">Complete Your Profile</h2>
            {sessionUser?.email && (
              <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 text-xs font-black px-4 py-2 rounded-xl border border-slate-100">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                {sessionUser.email}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Name</Label>
              <Input
                required
                placeholder="How should we address you?"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-0 transition-all font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Create Password</Label>
              <div className="relative">
                <Input
                  required
                  type={showPwd ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-1.5 px-1 mt-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i <= strength ? strengthColors[strength] : "bg-slate-100")} />
                  ))}
                  <span className={cn("text-[9px] font-black uppercase ml-2", strength < 3 ? "text-amber-500" : "text-emerald-600")}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Identity</Label>
              <Input
                required
                type="password"
                placeholder="Repeat password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-bold",
                  confirmPwd && password !== confirmPwd ? "border-red-500 bg-red-50" : "focus:border-emerald-500"
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || !fullName || password.length < 8 || password !== confirmPwd}
              className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 disabled:opacity-30 disabled:shadow-none transition-all active:scale-[0.98] mt-4"
            >
              {isPending ? (
                <span className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> Activating Profile...</span>
              ) : (
                "Join Workspace →"
              )}
            </Button>
          </form>

          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Identity Verified · SSL Encrypted
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-px w-20 bg-slate-100" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">DevSia Platform Services</p>
        </div>
      </div>
    </div>
  )
}
