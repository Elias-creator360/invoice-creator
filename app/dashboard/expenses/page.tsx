'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { expensesApi } from '@/lib/api'
import type { Expense } from '@/lib/supabase'
import { PermissionGuard, ConditionalRender } from '@/components/PermissionGuard'
import { usePermissions } from '@/lib/permissions'

export default function ExpensesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { checkPagePermission } = usePermissions()
  const permission = checkPagePermission('/dashboard/expenses')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    category: '',
    description: '',
    amount: 0,
    payment_method: ''
  })

  useEffect(() => {
    // Check if we should auto-show the form from Quick Actions
    if (searchParams.get('new') === 'true') {
      setShowForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await expensesApi.getAll()
      setExpenses(data)
    } catch (err) {
      setError('Failed to load expenses. Please check your Supabase configuration.')
      console.error('Error loading expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await expensesApi.create(formData)
      await loadExpenses()
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vendor_name: '',
        category: '',
        description: '',
        amount: 0,
        payment_method: ''
      })
      setShowForm(false)
    } catch (err) {
      setError('Failed to save expense. Please try again.')
      console.error('Error saving expense:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      setError(null)
      await expensesApi.delete(id)
      await loadExpenses()
    } catch (err) {
      setError('Failed to delete expense. Please try again.')
      console.error('Error deleting expense:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading expenses...</p>
      </div>
    )
  }

  return (
    <PermissionGuard pagePath="/dashboard/expenses">
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Expenses</h2>
            <p className="text-gray-600 mt-1">Track and manage your business expenses</p>
            {!permission.canEdit && (
              <p className="text-amber-600 text-sm mt-1">⚠️ You have view-only access</p>
            )}
          </div>
          <ConditionalRender pagePath="/dashboard/expenses" requiredLevel="edit">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </ConditionalRender>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>All-time expense summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        {showForm && permission.canEdit && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Expense</CardTitle>
              <CardDescription>Record a new business expense</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      placeholder="Vendor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Office Supplies, Travel, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What was this expense for?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Input
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      placeholder="e.g., Credit Card, Cash, etc."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save Expense</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
              <CardTitle>Expense History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search expenses..."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.vendor_name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.payment_method}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConditionalRender pagePath="/dashboard/expenses" requiredLevel="edit">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </ConditionalRender>
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
