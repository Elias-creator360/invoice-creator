import type {
  AdminUser,
  AdminRole,
  Permission,
  UserPermission,
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolesRequest,
  UpdateRolePermissionsRequest
} from './admin-types'

const API_BASE_URL = 'http://localhost:3001/api'

const getAuthHeaders = () => {
  // Use localStorage token since the app uses backend JWT auth, not Supabase auth
  const token = localStorage.getItem('auth_token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// User Management API
export const adminUsersApi = {
  async getAll(): Promise<AdminUser[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch users')
    return response.json()
  },

  async getById(id: number): Promise<AdminUser> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user')
    return response.json()
  },

  async create(data: CreateUserRequest): Promise<AdminUser> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }
    return response.json()
  },

  async update(id: number, data: UpdateUserRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }
    return response.json()
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }
    return response.json()
  },

  async assignRoles(userId: number, data: AssignRolesRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign roles')
    }
    return response.json()
  }
}

// Role Management API
export const adminRolesApi = {
  async getAll(): Promise<AdminRole[]> {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch roles')
    return response.json()
  },

  async getById(id: number): Promise<AdminRole> {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch role')
    return response.json()
  },

  async create(data: CreateRoleRequest): Promise<AdminRole> {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create role')
    }
    return response.json()
  },

  async update(id: number, data: UpdateRoleRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update role')
    }
    return response.json()
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete role')
    }
    return response.json()
  },

  async updatePermissions(roleId: number, data: UpdateRolePermissionsRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update permissions')
    }
    return response.json()
  }
}

// Permission Management API
export const adminPermissionsApi = {
  async getAll(): Promise<Permission[]> {
    const response = await fetch(`${API_BASE_URL}/admin/permissions`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch permissions')
    return response.json()
  },

  async getUserPermissions(): Promise<UserPermission[]> {
    const response = await fetch(`${API_BASE_URL}/auth/permissions`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch user permissions')
    return response.json()
  }
}
