import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)  // { full_name, phone }
  const [loading, setLoading] = useState(true)

  // Fetch profile from Supabase profiles table
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }

  useEffect(() => {
    // onAuthStateChange fires immediately with current session
    // so we use it as the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
        fetchProfile(session.user.id)
        } else {
        setProfile(null)
        }
        setLoading(false)
    })

    return () => subscription.unsubscribe()
    }, [])

  // Update profile in Supabase and local state
  const updateProfile = async (updates) => {
    if (!user) return
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
        if (!error) setProfile(prev => ({ ...prev, ...updates }))
        return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile, signOut }}>
        {!loading ? children : null}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}