'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Eye, EyeOff } from 'lucide-react'

const formSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: values.password
    })

    setIsLoading(false)
    if (!error) {
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      form.setError('root', { message: error.message })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px] opacity-60" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
            <img src="/dev-sia.png" alt="Logo" className="h-14 w-auto object-contain shadow-xl rounded-2xl p-2 bg-white" />
            <span className="text-3xl font-bold tracking-tight text-slate-900">DevSia</span>
          </Link>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border-white/60 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-3 text-center pt-10 px-8">
            <CardTitle className="text-3xl md:text-4xl font-semibold text-slate-900 font-playfair tracking-tight">
              Set New Password
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Choose a strong password to protect your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            {isSuccess ? (
              <div className="rounded-2xl bg-emerald-50/50 p-6 text-center border border-emerald-100/50 animate-in zoom-in-95 duration-500">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                  Password updated successfully!<br />
                  Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold ml-1">New Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="h-14 bg-white/50 border-slate-200/60 rounded-2xl focus-visible:ring-emerald-500 pr-12 font-medium px-5 transition-all"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="ml-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold ml-1">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="h-14 bg-white/50 border-slate-200/60 rounded-2xl focus-visible:ring-emerald-500 font-medium px-5 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="ml-1" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive px-1">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-14 w-full bg-slate-900 hover:bg-black text-white font-bold text-lg rounded-2xl shadow-lg shadow-slate-900/10 transition-all hover:shadow-xl hover:-translate-y-0.5 mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : 'Update password'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-300">
          DevSia © 2026 • Secure Access
        </p>
      </div>
    </div>
  )
}
