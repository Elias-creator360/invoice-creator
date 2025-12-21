'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { productsApi } from '@/lib/api'
import type { Product } from '@/lib/supabase'
import { PermissionGuard, ConditionalRender } from '@/components/PermissionGuard'
import { usePermissions } from '@/lib/permissions'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { checkPagePermission } = usePermissions()
  const permission = checkPagePermission('/dashboard/products')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    sku: '',
    stock: 0
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (err) {
      setError('Failed to load products. Please check your Supabase configuration.')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      
      if (editingId !== null) {
        // Update existing product
        await productsApi.update(editingId, formData)
      } else {
        // Add new product
        await productsApi.create(formData)
      }
      
      await loadProducts()
      setFormData({ name: '', description: '', price: 0, category: '', sku: '', stock: 0 })
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setError('Failed to save product. Please try again.')
      console.error('Error saving product:', err)
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      sku: product.sku || '',
      stock: product.stock || 0
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      setError(null)
      await productsApi.delete(id)
      await loadProducts()
    } catch (err) {
      setError('Failed to delete product. Please try again.')
      console.error('Error deleting product:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <PermissionGuard pagePath="/dashboard/products">
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Products & Services</h2>
            <p className="text-gray-600 mt-1">Manage your product and service catalog</p>
            {!permission.canEdit && (
              <p className="text-amber-600 text-sm mt-1">⚠️ You have view-only access</p>
            )}
          </div>
          <ConditionalRender pagePath="/dashboard/products" requiredLevel="edit">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
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
              <CardTitle>{editingId ? 'Edit Product/Service' : 'New Product/Service'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update the product or service details' : 'Add a new product or service to your catalog'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product/Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., IT Services"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a category</option>
                      <option value="Services">Services</option>
                      <option value="Products">Products</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price === 0 ? '' : formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Update Product' : 'Add Product'}</Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({ name: '', description: '', price: 0, category: '' })
                  }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Products & Services</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-gray-600">{product.description}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ConditionalRender pagePath="/dashboard/products" requiredLevel="edit">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            title="Delete product"
                          >
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
