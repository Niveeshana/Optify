import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    try {
      // Fetch role directly from Supabase (bypass backend)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        // Profile missing — create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
            role: authUser.user_metadata?.role || 'patient',
          })
          .select()
          .single()
        setUser(newProfile)
      } else {
        setUser(data)
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
      // Fallback — treat as patient so they're not stuck
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: '',
        role: 'patient',
      })
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, fullName, role = 'patient') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)