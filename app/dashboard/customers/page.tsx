'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react'
import { customersApi } from '@/lib/api'
import type { Customer } from '@/lib/supabase'
import { PermissionGuard, ConditionalRender } from '@/components/PermissionGuard'
import { usePermissions } from '@/lib/permissions'

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { checkPagePermission } = usePermissions()
  const permission = checkPagePermission('/dashboard/customers')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    status: 'active' as 'active' | 'inactive' | 'prospective' | 'tentative'
  })

  useEffect(() => {
    // Check if we should auto-show the form from Quick Actions
    if (searchParams.get('new') === 'true') {
      setShowForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await customersApi.getAll()
      setCustomers(data)
    } catch (err) {
      setError('Failed to load customers. Please check your Supabase configuration.')
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      
      if (editingId !== null) {
        // Update existing customer
        await customersApi.update(editingId, formData)
      } else {
        // Add new customer
        await customersApi.create(formData)
      }
      
      await loadCustomers()
      setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', status: 'active' })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setError('Failed to save customer. Please try again.')
      console.error('Error saving customer:', err)
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      status: customer.status
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      setError(null)
      await customersApi.delete(id)
      await loadCustomers()
    } catch (err) {
      setError('Failed to delete customer. Please try again.')
      console.error('Error deleting customer:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading customers...</p>
      </div>
    )
  }

  return (
    <PermissionGuard pagePath="/dashboard/customers">
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
            {!permission.canEdit && (
              <p className="text-amber-600 text-sm mt-1">⚠️ You have view-only access</p>
            )}
          </div>
          <ConditionalRender pagePath="/dashboard/customers" requiredLevel="edit">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </ConditionalRender>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {showForm && permission.canEdit && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId !== null ? 'Edit Customer' : 'New Customer'}</CardTitle>
              <CardDescription>{editingId !== null ? 'Update customer information' : 'Add a new customer to your database'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'prospective' | 'tentative' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="prospective">Prospective</option>
                      <option value="tentative">Tentative</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingId !== null ? 'Update Customer' : 'Save Customer'}</Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', status: 'active' })
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Customer List</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.city}, {customer.state} {customer.zip}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' :
                        customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        customer.status === 'prospective' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(customer.status || 'active').charAt(0).toUpperCase() + (customer.status || 'active').slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ConditionalRender pagePath="/dashboard/customers" requiredLevel="edit">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </ConditionalRender>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
