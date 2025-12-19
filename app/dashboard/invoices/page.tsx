'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Eye, Trash2, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  total: number
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load invoices from localStorage
    const loadInvoices = () => {
      const savedInvoices = localStorage.getItem('invoices')
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices))
      } else {
        // Initial mock data if no saved invoices
        const initialInvoices = [
          { id: 1, invoice_number: 'INV-1001', customer_name: 'Acme Corporation', date: '2024-12-01', due_date: '2024-12-31', status: 'paid', total: 5000 },
          { id: 2, invoice_number: 'INV-1002', customer_name: 'TechStart LLC', date: '2024-12-10', due_date: '2025-01-09', status: 'sent', total: 3500 },
          { id: 3, invoice_number: 'INV-1003', customer_name: 'Global Industries', date: '2024-12-15', due_date: '2025-01-14', status: 'draft', total: 7200 },
          { id: 4, invoice_number: 'INV-1004', customer_name: 'Acme Corporation', date: '2024-11-15', due_date: '2024-12-15', status: 'overdue', total: 2800 }
        ]
        setInvoices(initialInvoices)
        localStorage.setItem('invoices', JSON.stringify(initialInvoices))
      }
    }
    
    loadInvoices()
    
    // Listen for storage changes from other tabs/windows
    const handleStorageChange = () => {
      loadInvoices()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Poll for changes every second (in case same tab)
    const interval = setInterval(loadInvoices, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleDelete = (id: number) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id)
    setInvoices(updatedInvoices)
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices))
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
            <p className="text-gray-600 mt-1">Create and manage your invoices</p>
          </div>
          <Button onClick={() => router.push('/dashboard/invoices/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Draft</CardDescription>
              <CardTitle className="text-2xl">
                {invoices.filter(i => i.status === 'draft').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sent</CardDescription>
              <CardTitle className="text-2xl">
                {invoices.filter(i => i.status === 'sent').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">
                {invoices.filter(i => i.status === 'paid').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {invoices.filter(i => i.status === 'overdue').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Invoices</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
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
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                          title="Edit invoice"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this invoice?')) {
                              handleDelete(invoice.id)
                            }
                          }}
                          title="Delete invoice"
                        >
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
