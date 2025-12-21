'use client'

import { useEffect, useState } from 'react'
import { useRequireAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Shield, 
  Key, 
  UserPlus,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react'

interface User {
  id: number
  first_name?: string
  last_name?: string
  email: string
  company_name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  roles?: string[]
}

interface Role {
  id: number
  name: string
  description: string
  is_system: number
  user_count: number
  permission_count: number
}

interface Permission {
  id: number
  page_name: string
  page_path: string
  description: string
  access_level?: string
}

export default function AdminPage() {
  const { loading } = useRequireAdmin()
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users')
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    role: 'User',
    isActive: true
  })

  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: ''
  })

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingTab, setPendingTab] = useState<'users' | 'roles' | 'permissions' | null>(null)

  // Assign roles state
  const [showAssignRolesModal, setShowAssignRolesModal] = useState(false)
  const [assigningUser, setAssigningUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!loading) {
      fetchUsers()
      fetchRoles()
      fetchPermissions()
    }
  }, [loading])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const getToken = () => {
    return localStorage.getItem('auth_token') || ''
  }

  // ==================== USER FUNCTIONS ====================
  
  const fetchUsers = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateUser = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        showMessage('success', 'User created successfully')
        setShowUserModal(false)
        setUserForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', role: 'User', isActive: true })
        fetchUsers()
        fetchRoles() // Refresh roles to update user counts
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to create user')
      }
    } catch (error) {
      showMessage('error', 'Error creating user')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          email: userForm.email,
          companyName: userForm.companyName,
          role: userForm.role,
          isActive: userForm.isActive,
          ...(userForm.password && { password: userForm.password })
        })
      })

      if (response.ok) {
        showMessage('success', 'User updated successfully')
        setShowUserModal(false)
        setEditingUser(null)
        setUserForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', role: 'User', isActive: true })
        fetchUsers()
        fetchRoles() // Refresh roles to update user counts
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to update user')
      }
    } catch (error) {
      showMessage('error', 'Error updating user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showMessage('success', 'User deleted successfully')
        fetchUsers()
        fetchRoles() // Refresh roles to update user counts
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to delete user')
      }
    } catch (error) {
      showMessage('error', 'Error deleting user')
    }
  }

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email,
      password: '',
      companyName: user.company_name,
      role: user.role,
      isActive: user.is_active
    })
    setShowUserModal(true)
  }

  const openAssignRoles = (user: User) => {
    setAssigningUser(user)
    // Get current role assignments
    fetchUserRoles(user.id)
    setShowAssignRolesModal(true)
  }

  const fetchUserRoles = async (userId: number) => {
    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedRoles(data.assignedRoles?.map((r: any) => r.id) || [])
      }
    } catch (error) {
      console.error('Error fetching user roles:', error)
    }
  }

  const handleAssignRoles = async () => {
    if (!assigningUser) return

    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/users/${assigningUser.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roleIds: selectedRoles })
      })

      if (response.ok) {
        showMessage('success', 'Roles assigned successfully')
        setShowAssignRolesModal(false)
        setAssigningUser(null)
        setSelectedRoles([])
        fetchUsers()
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to assign roles')
      }
    } catch (error) {
      showMessage('error', 'Error assigning roles')
    }
  }

  // ==================== ROLE FUNCTIONS ====================
  
  const fetchRoles = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleCreateRole = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleForm)
      })

      if (response.ok) {
        showMessage('success', 'Role created successfully')
        setShowRoleModal(false)
        setRoleForm({ name: '', description: '' })
        fetchRoles()
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to create role')
      }
    } catch (error) {
      showMessage('error', 'Error creating role')
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleForm)
      })

      if (response.ok) {
        showMessage('success', 'Role updated successfully')
        setShowRoleModal(false)
        setEditingRole(null)
        setRoleForm({ name: '', description: '' })
        fetchRoles()
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to update role')
      }
    } catch (error) {
      showMessage('error', 'Error updating role')
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showMessage('success', 'Role deleted successfully')
        fetchRoles()
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to delete role')
      }
    } catch (error) {
      showMessage('error', 'Error deleting role')
    }
  }

  const openEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description
    })
    setShowRoleModal(true)
  }

  // ==================== PERMISSION FUNCTIONS ====================
  
  const fetchPermissions = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/admin/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchRolePermissions = async (roleName: string) => {
    try {
      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/roles/${encodeURIComponent(roleName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRolePermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error)
    }
  }

  const handleRoleSelect = (roleName: string) => {
    if (hasUnsavedChanges) {
      setPendingTab(null) // Just switching roles within permissions
      setShowUnsavedWarning(true)
      return
    }
    setSelectedRole(roleName)
    fetchRolePermissions(roleName)
    setHasUnsavedChanges(false)
  }

  const handlePermissionChange = (permissionId: number, accessLevel: string) => {
    setRolePermissions(prev => 
      prev.map(p => 
        p.id === permissionId ? { ...p, access_level: accessLevel } : p
      )
    )
    setHasUnsavedChanges(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    try {
      const permissionsData = rolePermissions.map(p => ({
        feature_name: p.page_name,  // Use actual feature name, not ID
        feature_path: p.page_path,
        access_level: p.access_level || 'none'
      }))

      console.log('Saving permissions for role:', selectedRole)
      console.log('Permissions data:', permissionsData)

      const token = getToken()
      const response = await fetch(`http://localhost:3001/api/admin/roles/${encodeURIComponent(selectedRole)}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: permissionsData })
      })

      if (response.ok) {
        showMessage('success', 'Permissions updated successfully')
        fetchRoles()
        setHasUnsavedChanges(false)
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to update permissions')
      }
    } catch (error) {
      showMessage('error', 'Error updating permissions')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => {
            if (activeTab === 'permissions' && hasUnsavedChanges) {
              setPendingTab('users')
              setShowUnsavedWarning(true)
            } else {
              setActiveTab('users')
            }
          }}
          className={`pb-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-5 w-5" />
          Users
        </button>
        <button
          onClick={() => {
            if (activeTab === 'permissions' && hasUnsavedChanges) {
              setPendingTab('roles')
              setShowUnsavedWarning(true)
            } else {
              setActiveTab('roles')
            }
          }}
          className={`pb-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="h-5 w-5" />
          Roles
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Key className="h-5 w-5" />
          Permissions
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Button onClick={() => {
              setEditingUser(null)
              setUserForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', role: 'User', isActive: true })
              setShowUserModal(true)
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Full Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Company</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.company_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'Admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Role Management</h2>
            <Button onClick={() => {
              setEditingRole(null)
              setRoleForm({ name: '', description: '' })
              setShowRoleModal(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {role.name}
                      {role.is_system === 1 && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          System
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <Users className="h-4 w-4 inline mr-1" />
                    {role.user_count} users
                  </div>
                  <div>
                    <Key className="h-4 w-4 inline mr-1" />
                    {role.permission_count} permissions
                  </div>
                </div>
                {role.is_system === 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditRole(role)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Permission Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Role Selection */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Select Role</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.name)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedRole === role.name
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Permissions Configuration */}
            <Card className="p-6 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Page Permissions</h3>
                {selectedRole && (
                  <Button onClick={handleSavePermissions}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </div>

              {selectedRole ? (
                <div className="space-y-3">
                  {rolePermissions.length > 0 ? (
                    rolePermissions.map((perm) => (
                      <div key={perm.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-gray-900">{perm.page_name}</div>
                            <div className="text-sm text-gray-500">{perm.page_path}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            perm.access_level === 'edit' 
                              ? 'bg-green-100 text-green-700'
                              : perm.access_level === 'view'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {perm.access_level === 'edit' ? 'Full Access' : perm.access_level === 'view' ? 'View Only' : 'No Access'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePermissionChange(perm.id, 'none')}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                              perm.access_level === 'none'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            🚫 None
                          </button>
                          <button
                            onClick={() => handlePermissionChange(perm.id, 'view')}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                              perm.access_level === 'view'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handlePermissionChange(perm.id, 'edit')}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                              perm.access_level === 'edit'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No permissions found for this role</p>
                      <p className="text-sm mt-1">Make sure the role_permissions table is set up in Supabase</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Key className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Select a role to manage its permissions</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>
              <button onClick={() => {
                setShowUserModal(false)
                setEditingUser(null)
              }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password {editingUser && '(leave blank to keep current)'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={userForm.companyName}
                  onChange={(e) => setUserForm({ ...userForm, companyName: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  className="flex-1"
                >
                  {editingUser ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <button onClick={() => {
                setShowRoleModal(false)
                setEditingRole(null)
              }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Manager"
                />
              </div>

              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Manages team and operations"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  className="flex-1"
                >
                  {editingRole ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false)
                    setEditingRole(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Assign Roles Modal */}
      {showAssignRolesModal && assigningUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Assign Roles to {assigningUser.email}
              </h3>
              <button onClick={() => {
                setShowAssignRolesModal(false)
                setAssigningUser(null)
                setSelectedRoles([])
              }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.id])
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 mt-4 border-t">
              <Button onClick={handleAssignRoles} className="flex-1">
                Assign Roles
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignRolesModal(false)
                  setAssigningUser(null)
                  setSelectedRoles([])
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xl font-semibold">Unsaved Changes</h3>
                <p className="text-gray-600 mt-2">
                  You have unsaved permission changes. If you leave now, your changes will be discarded.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setHasUnsavedChanges(false)
                  if (pendingTab) {
                    setActiveTab(pendingTab)
                    setPendingTab(null)
                  }
                  setShowUnsavedWarning(false)
                }}
                className="flex-1 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => {
                  setShowUnsavedWarning(false)
                  setPendingTab(null)
                }}
                className="flex-1"
              >
                Stay on Page
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
