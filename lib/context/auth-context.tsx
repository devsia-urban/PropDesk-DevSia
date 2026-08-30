'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { type User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { type Profile, type Agency, type UserRole } from '@/lib/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  agency: Agency | null
  isLoading: boolean
  isReadOnly: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getInitialSession() {
      const { data: { user: initialUser } } = await supabase.auth.getUser()
      setUser(initialUser)
      
      if (initialUser) {
        await fetchProfileAndAgency(initialUser.id)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // 🚨 EMERGENCY FAIL-SAFE: Never stay stuck in loading more than 5 seconds
    const failSafe = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) console.warn('[AUTH] Emergency loading fail-safe triggered after 5s')
        return false
      })
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === 'SIGNED_IN' && currentUser) {
        await fetchProfileAndAgency(currentUser.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setAgency(null)
      }
      setIsLoading(false)
    })

    // 🔒 CONCURRENT LOGIN: Check every 10 seconds if token changed in database
    const intervalId = setInterval(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser && typeof window !== 'undefined') {
        const localSessionToken = localStorage.getItem('propdesk_session_token')
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('current_session_token')
          .eq('id', currentUser.id)
          .single()
        
        if (profileCheck?.current_session_token && profileCheck.current_session_token !== localSessionToken) {
          console.warn('[AUTH] Concurrent login detected via polling. Signing out...')
          await supabase.auth.signOut()
          window.location.href = '/login'
        }
      }
    }, 10000) // 10 seconds

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [])

  async function fetchProfileAndAgency(userId: string) {
    try {
      console.log(`[AUTH_DEBUG] Fetching profile for: ${userId}`)
      
      let profileData = null
      let fetchError = null
      let retries = 0

      // Retry loop to handle Supabase "AbortError: Lock broken" during hot-reloads
      while (retries < 3) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, agency:agencies(*)')
          .eq('id', userId)
          .limit(1)

        if (error) {
          if (error.message.includes('AbortError') || error.message.includes('Lock broken') || error.message.includes('fetch')) {
            console.warn(`[AUTH_DEBUG] Profile Fetch AbortError. Retrying (${retries + 1}/3)...`)
            await new Promise(resolve => setTimeout(resolve, 500))
            retries++
            fetchError = error
            continue
          }
          fetchError = error
          break
        }
        
        if (data && data.length > 1) {
          console.warn('[AUTH_DEBUG] WARN: Multiple profiles returned for user!', data)
        }
        
        profileData = data?.[0] || null
        break
      }

      if (!profileData) {
        console.error('[AUTH_DEBUG] Profile Fetch Error after retries: no profile found in DB for user', userId);
        
        // Auto-fix: try to have the backend force-create the profile using Admin privileges!
        try {
          const res = await fetch('/api/team/fix-profile', { method: 'POST' });
          if (res.ok) {
            const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (retryData) {
              profileData = retryData;
              console.log('[AUTH_DEBUG] Profile auto-fixed successfully!');
            }
          }
        } catch (e) {
          console.error('[AUTH_DEBUG] Auto-fix failed', e);
        }

        if (!profileData) {
          // Force sign out if the database trigger AND auto-fix failed
          await supabase.auth.signOut();
          setProfile(null);
          setIsLoading(false);
          return;
        }
      }

      if (profileData) {
        // 🔒 SECURITY KILL-SWITCH: If user is deactivated, force sign out immediately
        if (!profileData.is_active) {
          console.warn('[AUTH] User is deactivated. Signing out.')
          await supabase.auth.signOut()
          setProfile(null)
          setAgency(null)
          setIsLoading(false)
          return
        }

        // 🔒 CONCURRENT LOGIN PREVENTION (Zero Disruption)
        if (typeof window !== 'undefined') {
          const localSessionToken = localStorage.getItem('propdesk_session_token')
          const dbSessionToken = profileData.current_session_token

          // Only kick out if db has a token AND it doesn't match the local one.
          // This ensures existing logged-in users (dbSessionToken == null) are not disrupted.
          if (dbSessionToken && dbSessionToken !== localSessionToken) {
            console.warn('[AUTH] Concurrent login detected. Signing out...')
            await supabase.auth.signOut()
            setProfile(null)
            setAgency(null)
            setIsLoading(false)
            return
          }
        }

        const { agency: agencyData, ...restProfile } = profileData as any
        const isSuperAdmin = restProfile.is_super_admin
        
        setProfile({
          ...restProfile,
          is_super_admin: isSuperAdmin
        } as Profile)
        setAgency(agencyData as Agency)
      }
    } catch (err) {
      console.error('[AUTH_DEBUG] Unexpected error in fetchProfileAndAgency:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const isReadOnly = agency?.subscription_status === 'paused' && !profile?.is_super_admin

  return (
    <AuthContext.Provider value={{ user, profile, agency, isLoading, isReadOnly }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useProfile() {
  const { profile, isLoading } = useAuth()
  if (!isLoading && !profile) {
    throw new Error('useProfile must be used with an authenticated user profile')
  }
  return profile
}

export function useRole() {
  const profile = useProfile()
  const role = profile?.role as UserRole

  return {
    role,
    isAdmin: role === 'admin',
    isAgent: role === 'agent',
    isViewer: role === 'viewer'
  }
}
