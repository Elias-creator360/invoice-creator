'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  companyName: string
  role: 'Admin' | 'User'
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = localStorage.getItem('token')
    const storedUserId = localStorage.getItem('userId')
    const storedEmail = localStorage.getItem('email')
    const storedCompanyName = localStorage.getItem('companyName')
    const storedRole = localStorage.getItem('role') as 'Admin' | 'User'

    console.log('Auth check:', { 
      hasToken: !!storedToken, 
      hasUserId: !!storedUserId, 
      hasEmail: !!storedEmail,
      hasCompanyName: !!storedCompanyName,
      hasRole: !!storedRole 
    })

    if (storedToken && storedUserId && storedEmail && storedCompanyName && storedRole) {
      setToken(storedToken)
      setUser({
        id: parseInt(storedUserId),
        email: storedEmail,
        companyName: storedCompanyName,
        role: storedRole
      })
      console.log('User authenticated from localStorage')
    } else {
      console.log('No valid session found')
    }
    
    setLoading(false)
  }, [])

  const login = (newToken: string, userData: User) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('token', newToken)
    localStorage.setItem('userId', userData.id.toString())
    localStorage.setItem('email', userData.email)
    localStorage.setItem('companyName', userData.companyName)
    localStorage.setItem('role', userData.role)
  }

  const logout = async () => {
    try {
      // Call logout endpoint
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('email')
      localStorage.removeItem('companyName')
      localStorage.removeItem('role')
      setToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
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
