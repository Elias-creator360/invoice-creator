'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './auth'
import { adminPermissionsApi } from './admin-api'
import type { UserPermission } from './admin-types'

/**
 * Hook to check user permissions for pages
 * Returns permission data and helper functions
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth()
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchPermissions()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchPermissions = async () => {
    try {
      const perms = await adminPermissionsApi.getUserPermissions()
      setPermissions(perms)
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if user has access to a specific page
   * @param pagePath - The path to check (e.g., '/dashboard/customers')
   * @returns Object with hasAccess, canView, canEdit properties
   */
  const checkPagePermission = (pagePath: string) => {
    // Admin users have full access to everything
    if (user?.role === 'Admin') {
      return {
        hasAccess: true,
        canView: true,
        canEdit: true,
        accessLevel: 'edit' as const
      }
    }

    const permission = permissions.find(p => p.page_path === pagePath)
    
    if (!permission || permission.access_level === 'none') {
      return {
        hasAccess: false,
        canView: false,
        canEdit: false,
        accessLevel: 'none' as const
      }
    }

    return {
      hasAccess: true,
      canView: permission.access_level === 'view' || permission.access_level === 'edit',
      canEdit: permission.access_level === 'edit',
      accessLevel: permission.access_level
    }
  }

  /**
   * Check if user can view a specific page
   */
  const canView = (pagePath: string): boolean => {
    return checkPagePermission(pagePath).canView
  }

  /**
   * Check if user can edit on a specific page
   */
  const canEdit = (pagePath: string): boolean => {
    return checkPagePermission(pagePath).canEdit
  }

  /**
   * Check if user has any access to a specific page
   */
  const hasAccess = (pagePath: string): boolean => {
    return checkPagePermission(pagePath).hasAccess
  }

  return {
    permissions,
    loading,
    checkPagePermission,
    canView,
    canEdit,
    hasAccess,
    refetch: fetchPermissions
  }
}

/**
 * Hook for components that require specific permission level
 * Automatically handles loading and redirect
 */
export function useRequirePermission(
  pagePath: string,
  requiredLevel: 'view' | 'edit' = 'view'
) {
  const { checkPagePermission, loading } = usePermissions()
  const permission = checkPagePermission(pagePath)

  const hasRequiredPermission = 
    requiredLevel === 'view' 
      ? permission.canView 
      : permission.canEdit

  return {
    loading,
    hasPermission: hasRequiredPermission,
    permission
  }
}
