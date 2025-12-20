'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { invoicesApi } from '@/lib/api'
import type { Invoice, InvoiceItem } from '@/lib/supabase'

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_number: '',
    date: '',
    due_date: '',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const invoice = await invoicesApi.getById(Number(params.id))
      
      if (invoice) {
        setFormData({
          customer_name: invoice.customer_name,
          invoice_number: invoice.invoice_number,
          date: invoice.date,
          due_date: invoice.due_date,
          notes: invoice.notes || ''
        })
        
        // Parse items if they are stored as a JSON string, otherwise use directly
        const parsedItems = typeof invoice.items === 'string' 
          ? JSON.parse(invoice.items) 
          : invoice.items || [{ description: '', quantity: 1, rate: 0, amount: 0 }]
        
        setItems(parsedItems)
      } else {
        setError('Invoice not found')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError('Failed to load invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate
    }
    
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const tax = subtotal * 0.14
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      
      // Filter out empty items
      const validItems = items.filter(item => item.description.trim() !== '')
      
      // Update the invoice in Supabase
      await invoicesApi.update(Number(params.id), {
        customer_name: formData.customer_name,
        invoice_number: formData.invoice_number,
        date: formData.date,
        due_date: formData.due_date,
        notes: formData.notes,
        items: validItems,
        subtotal,
        tax,
        total
      })
      
      alert('Invoice updated successfully!')
      router.push(`/dashboard/invoices/${params.id}`)
    } catch (error) {
      console.error('Error updating invoice:', error)
      setError('Error updating invoice. Please try again.')
      alert('Error updating invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading invoice...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Edit Invoice</h2>
          <p className="text-gray-600 mt-1">Update invoice details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Invoice Details */}
            <div className="col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        value={formData.invoice_number}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Invoice Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Line Items</CardTitle>
                    <Button type="button" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                        <div className="col-span-5 space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="Service or product description"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Rate</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate || ''}
                            onChange={(e) => updateItem(index, 'rate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Amount</Label>
                          <Input
                            value={formatCurrency(item.amount)}
                            disabled
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Minus className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Additional notes or payment terms"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT (14%):</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-xl">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button type="submit" className="w-full">
                      Update Invoice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/invoices/${params.id}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
    </div>
  )
}
