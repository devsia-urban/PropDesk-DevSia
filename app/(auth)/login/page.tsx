'use client'

import React, { useState, Suspense } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  username: z.string().min(1, { message: "email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agencyData, setAgencyData] = useState<{ name: string; logo_url: string | null } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitedEmail = searchParams.get('email') || ""

  // 🌍 Dynamic Branding Fetch
  React.useEffect(() => {
    async function fetchBranding() {
      const supabase = createClient()
      const hostname = window.location.hostname

      // Try to find agency by website/hostname
      const { data } = await supabase
        .from('agencies')
        .select('name, logo_url')
        .or(`website.ilike.%${hostname}%,name.ilike.%${hostname.split('.')[0]}%`)
        .limit(1)
        .maybeSingle()

      if (data) {
        setAgencyData(data)
      }
    }
    fetchBranding()
  }, [])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: invitedEmail,
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.username, // Using username field as email
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Check if user is active
      if (authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', authData.user.id)
          .single()

        if (profile && profile.is_active === false) {
          await supabase.auth.signOut()
          setError("Your account is currently disabled. Please contact your Agency Admin.")
          setIsLoading(false)
          return
        }

        // Concurrent Login Prevention: Set new session token
        const newSessionToken = crypto.randomUUID()
        localStorage.setItem('propdesk_session_token', newSessionToken)
        await supabase
          .from('profiles')
          .update({ current_session_token: newSessionToken })
          .eq('id', authData.user.id)
      }

      toast.success("Signed in successfully!")
      if (data.username === 'typepilotkeyboard@gmail.com') {
        router.push("/superadmin")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-4 sm:px-0">
      <Card className="border-none shadow-none md:border md:shadow-md md:rounded-2xl transition-all duration-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        <CardHeader className="space-y-4 pt-10 px-6 md:px-10 text-center">
          <div className="flex justify-center">
            <img src={agencyData?.logo_url || "/dev-sia.png"} alt="Logo" className="h-16 w-auto object-contain bg-white rounded-xl shadow-sm border border-slate-100 p-2" />
          </div>
          <div className="space-y-1">
            <CardDescription className="text-sm text-slate-500 font-medium">
              Sign in to your workspace
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 md:px-10 pb-10 space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600 rounded-lg">
              <AlertDescription className="text-sm font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700">email</Label>
              <Input
                id="username"
                placeholder="Enter your email"
                className="rounded-lg h-11 border-slate-200 focus-visible:ring-emerald-500"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500 font-medium">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="rounded-lg h-11 border-slate-200 pr-10 focus-visible:ring-emerald-500"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {form.formState.errors.password.message}
                </p>
              )}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="space-y-4 pt-2">
            <Separator className="bg-slate-200" />
            <p className="text-center text-xs text-slate-400">
              Trouble signing in? Contact your admin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
