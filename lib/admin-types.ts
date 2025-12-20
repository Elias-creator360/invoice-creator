// Admin Panel Type Definitions

export interface AdminUser {
  id: number
  first_name?: string
  last_name?: string
  email: string
  company_name: string
  role: 'Admin' | 'User'
  is_active: number
  last_login: string | null
  created_at: string
  roles?: string[]
  assignedRoles?: AdminRole[]
}

export interface AdminRole {
  id: number
  name: string
  description: string
  is_system: number
  user_count?: number
  permission_count?: number
  created_at?: string
  updated_at?: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  page_name: string
  page_path: string
  description: string
  access_level?: 'none' | 'view' | 'edit'
  created_at?: string
}

export interface RolePermission {
  role_id: number
  permission_id: number
  access_level: 'none' | 'view' | 'edit'
}

export interface UserPermission {
  page_name: string
  page_path: string
  access_level: 'none' | 'view' | 'edit'
}

export interface CreateUserRequest {
  firstName?: string
  lastName?: string
  email: string
  password: string
  companyName: string
  role?: 'Admin' | 'User'
  isActive?: boolean
  roleIds?: number[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  companyName?: string
  role?: 'Admin' | 'User'
  isActive?: boolean
  password?: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface AssignRolesRequest {
  roleIds: number[]
}

export interface UpdateRolePermissionsRequest {
  permissions: Array<{
    permission_id: number
    access_level: 'none' | 'view' | 'edit'
  }>
}
