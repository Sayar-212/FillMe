"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type User = {
  id: string
  name: string
  email?: string
  provider?: string
}

type AuthContextValue = {
  user: User | null
  signIn: (opts?: { provider?: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          provider: session.user.app_metadata?.provider
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          provider: session.user.app_metadata?.provider
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: async ({ provider = 'google' } = {}) => {
        await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        })
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
