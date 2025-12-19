'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  status: 'active' | 'inactive' | 'prospective' | 'tentative'
}

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
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
    // Load customers from localStorage
    const savedCustomers = localStorage.getItem('customers')
    if (savedCustomers) {
      const parsed = JSON.parse(savedCustomers)
      // Migrate old customers without status to have 'active' status
      const migrated = parsed.map((c: Customer) => ({
        ...c,
        status: c.status || 'active'
      }))
      setCustomers(migrated)
      localStorage.setItem('customers', JSON.stringify(migrated))
    } else {
      // Default customers if none exist
      const defaultCustomers = [
        { id: 1, name: 'Acme Corporation', email: 'contact@acme.com', phone: '555-0101', address: '123 Business St', city: 'New York', state: 'NY', zip: '10001', status: 'active' as const },
        { id: 2, name: 'TechStart LLC', email: 'hello@techstart.io', phone: '555-0102', address: '456 Innovation Ave', city: 'San Francisco', state: 'CA', zip: '94102', status: 'prospective' as const },
        { id: 3, name: 'Global Industries', email: 'info@global.com', phone: '555-0103', address: '789 Enterprise Blvd', city: 'Chicago', state: 'IL', zip: '60601', status: 'active' as const }
      ]
      setCustomers(defaultCustomers)
      localStorage.setItem('customers', JSON.stringify(defaultCustomers))
    }
  }, [])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let updatedCustomers
    
    if (editingId !== null) {
      // Update existing customer
      updatedCustomers = customers.map(c => 
        c.id === editingId ? { ...formData, id: editingId } : c
      )
    } else {
      // Add new customer
      const newCustomer = {
        id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
        ...formData
      }
      updatedCustomers = [...customers, newCustomer]
    }
    
    setCustomers(updatedCustomers)
    localStorage.setItem('customers', JSON.stringify(updatedCustomers))
    setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', status: 'active' })
    setShowForm(false)
    setEditingId(null)
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

  const handleDelete = (id: number) => {
    const updatedCustomers = customers.filter(c => c.id !== id)
    setCustomers(updatedCustomers)
    localStorage.setItem('customers', JSON.stringify(updatedCustomers))
  }

  return (
    <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {showForm && (
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}
