'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowRight } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    setIsLoading(false)
    if (!error) {
      setIsSubmitted(true)
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

          </Link>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border-white/60 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-3 text-center pt-10 px-8">
            <CardTitle className="text-3xl md:text-4xl font-semibold text-slate-900 font-playfair tracking-tight">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Enter your email and we'll send you a link to securely reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            {isSubmitted ? (
              <div className="rounded-2xl bg-emerald-50/50 p-6 text-center border border-emerald-100/50 animate-in zoom-in-95 duration-500">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✉️</span>
                </div>
                <p className="text-sm font-semibold text-emerald-800 leading-relaxed">
                  Check your email inbox!<br />
                  We've sent a password reset link to your address.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold ml-1">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@agency.com"
                            className="h-14 bg-white/50 border-slate-200/60 rounded-2xl focus-visible:ring-emerald-500 focus-visible:border-emerald-500/50 transition-all font-medium px-5"
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
                    className="h-14 w-full bg-slate-900 hover:bg-black text-white font-bold text-lg rounded-2xl shadow-lg shadow-slate-900/10 transition-all hover:shadow-xl hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : 'Send reset link'}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
              <Link
                href="/login"
                className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-300">
          Secure Property Management System
        </p>
      </div>
    </div>
  )
}
