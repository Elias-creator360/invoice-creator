'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName: string
  role: string
}

interface AuthContextType {
  user: User | null
  session: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setSession({ access_token: storedToken })
      loadUserData(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const loadUserData = async (token: string) => {
    try {
      // Fetch user details from backend API
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load user data')
      }

      const userData = await response.json()
      
      setUser({
        id: userData.id.toString(),
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        companyName: userData.company_name,
        role: userData.role
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      // Clear invalid token
      localStorage.removeItem('auth_token')
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    // We'll handle the actual login in the login page component
    // This is just a placeholder for the context API
    throw new Error('Use login page for authentication')
  }

  const logout = async () => {
    try {
      // Clear localStorage token
      localStorage.removeItem('auth_token')
      setUser(null)
      setSession(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hook for protected routes
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading, router, redirectTo])

  return { isAuthenticated, loading }
}

// Custom hook for admin-only routes
export function useRequireAdmin(redirectTo = '/dashboard') {
  const { isAdmin, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push(redirectTo)
    }
  }, [isAdmin, loading, isAuthenticated, router, redirectTo])

  return { isAdmin, loading }
}
