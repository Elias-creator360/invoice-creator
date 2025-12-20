'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    role: 'User'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .single()

        if (fetchError || !user) {
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        }

        if (!user.is_active) {
          throw new Error('Your account has been deactivated. Please contact your administrator.')
        }

        const passwordMatch = await bcrypt.compare(formData.password, user.password)
        if (!passwordMatch) {
          throw new Error('Invalid email or password. Please check your credentials and try again.')
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)

        // Store user data
        localStorage.setItem('userId', user.id.toString())
        localStorage.setItem('email', user.email)
        localStorage.setItem('companyName', user.company_name)
        localStorage.setItem('role', user.role)
        localStorage.setItem('token', 'supabase-session-' + user.id)

        console.log('Login successful, stored data:', {
          userId: user.id,
          email: user.email,
          role: user.role
        })

        // Show success message
        setSuccess('Login successful! Redirecting to dashboard...')

        // Small delay to show success message before redirect
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        router.push('/dashboard')
      } else {
        // Register
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('email')
          .eq('email', formData.email)
          .single()

        if (existingUser) {
          throw new Error('An account with this email already exists. Please use a different email or sign in.')
        }

        const hashedPassword = await bcrypt.hash(formData.password, 10)

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            email: formData.email,
            password: hashedPassword,
            company_name: formData.companyName,
            role: formData.role,
            is_active: true
          }])
          .select()
          .single()

        if (insertError) {
          throw new Error('Registration failed: ' + (insertError.message || 'Unable to create account. Please try again.'))
        }

        // Store user data
        localStorage.setItem('userId', newUser.id.toString())
        localStorage.setItem('email', newUser.email)
        localStorage.setItem('companyName', newUser.company_name)
        localStorage.setItem('role', newUser.role)
        localStorage.setItem('token', 'supabase-session-' + newUser.id)

        // Show success message
        setSuccess('Account created successfully! Redirecting to dashboard...')

        // Small delay to show success message before redirect
        await new Promise(resolve => setTimeout(resolve, 1000))

        router.push('/dashboard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      console.error('Authentication error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? 'Sign in to access your invoice dashboard' 
              : 'Sign up to start managing your invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isLogin}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
