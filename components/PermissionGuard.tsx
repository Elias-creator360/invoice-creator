'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  pagePath: string
  requiredLevel?: 'view' | 'edit'
  fallback?: ReactNode
  showAlert?: boolean
}

/**
 * Component that wraps content and only renders it if user has required permission
 * Optionally redirects or shows an alert if permission is denied
 */
export function PermissionGuard({ 
  children, 
  pagePath, 
  requiredLevel = 'view',
  fallback,
  showAlert = false
}: PermissionGuardProps) {
  const router = useRouter()
  const { checkPagePermission, loading } = usePermissions()

  const permission = checkPagePermission(pagePath)

  useEffect(() => {
    // Redirect if user has no access at all
    if (!loading && !permission.hasAccess) {
      router.push('/dashboard')
    }
  }, [loading, permission.hasAccess, router])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // No access at all
  if (!permission.hasAccess) {
    return fallback || (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Has access but not the required level (e.g., has 'view' but needs 'edit')
  if (requiredLevel === 'edit' && !permission.canEdit) {
    if (showAlert) {
      return (
        <div className="p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have view-only access to this page. Editing is disabled.
            </AlertDescription>
          </Alert>
          {children}
        </div>
      )
    }
    return fallback || children
  }

  return <>{children}</>
}

interface ProtectedButtonProps {
  pagePath: string
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  requireEdit?: boolean
  [key: string]: any
}

/**
 * Button component that is automatically disabled if user doesn't have edit permission
 */
export function ProtectedButton({ 
  pagePath, 
  children, 
  onClick,
  disabled = false,
  requireEdit = true,
  ...props 
}: ProtectedButtonProps) {
  const { checkPagePermission } = usePermissions()
  const permission = checkPagePermission(pagePath)

  const isDisabled = disabled || (requireEdit && !permission.canEdit)

  return (
    <button
      {...props}
      onClick={onClick}
      disabled={isDisabled}
      className={props.className}
      title={isDisabled && !disabled ? 'You do not have permission to perform this action' : undefined}
    >
      {children}
    </button>
  )
}

interface ConditionalRenderProps {
  pagePath: string
  requiredLevel: 'view' | 'edit'
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that conditionally renders children based on permission level
 * Useful for showing/hiding buttons or sections based on permissions
 */
export function ConditionalRender({ 
  pagePath, 
  requiredLevel, 
  children,
  fallback 
}: ConditionalRenderProps) {
  const { checkPagePermission, loading } = usePermissions()

  if (loading) return null

  const permission = checkPagePermission(pagePath)

  const hasPermission = requiredLevel === 'view' 
    ? permission.canView 
    : permission.canEdit

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface ReadOnlyWrapperProps {
  pagePath: string
  children: ReactNode
  className?: string
}

/**
 * Wrapper that adds read-only styling when user only has view permission
 */
export function ReadOnlyWrapper({ 
  pagePath, 
  children, 
  className = '' 
}: ReadOnlyWrapperProps) {
  const { checkPagePermission } = usePermissions()
  const permission = checkPagePermission(pagePath)

  const readOnlyClass = !permission.canEdit ? 'opacity-70 pointer-events-none' : ''

  return (
    <div className={`${className} ${readOnlyClass}`}>
      {children}
    </div>
  )
}
