'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import { customersApi, productsApi, invoicesApi } from '@/lib/api'
import type { Customer, Product, InvoiceItem } from '@/lib/supabase'

export default function NewInvoicePage() {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [productSearches, setProductSearches] = useState<{ [key: number]: string }>({})
  const [showProductDropdown, setShowProductDropdown] = useState<{ [key: number]: boolean }>({})
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
    notes: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersApi.getAll(),
        productsApi.getAll()
      ])
      setCustomers(customersData)
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setFormData({ ...formData, customer_id: customer.name })
    setShowCustomerDropdown(false)
  }

  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearches[index] || ''
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      rate: product.price,
      amount: newItems[index].quantity * product.price
    }
    setItems(newItems)
    setProductSearches({ ...productSearches, [index]: product.name })
    setShowProductDropdown({ ...showProductDropdown, [index]: false })
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
    
    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }

    try {
      const invoiceData = {
        invoice_number: formData.invoice_number,
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        date: formData.date,
        due_date: formData.due_date,
        items: items.filter(item => item.description), // Only include items with description
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: formData.status,
        notes: formData.notes
      }

      await invoicesApi.create(invoiceData)
      alert('Invoice created successfully!')
      router.push('/dashboard/invoices')
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice. Please try again.')
    }
  }

  return (
    <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Invoice</h2>
          <p className="text-gray-600 mt-1">Fill in the details to create a new invoice</p>
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
                    <div className="space-y-2 relative">
                      <Label htmlFor="customer">Customer *</Label>
                      <Input
                        id="customer"
                        placeholder="Search or select customer"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => {
                          // Delay to allow click event on dropdown items to fire first
                          setTimeout(() => setShowCustomerDropdown(false), 200)
                        }}
                        required
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={(e) => {
                                e.preventDefault() // Prevent blur from firing before click
                                handleCustomerSelect(customer)
                              }}
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
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
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'sent' | 'paid' | 'overdue' })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
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
                        <div className="col-span-5 space-y-2 relative">
                          <Label>Description</Label>
                          <Input
                            placeholder="Search or type product/service"
                            value={productSearches[index] !== undefined ? productSearches[index] : item.description}
                            onChange={(e) => {
                              setProductSearches({ ...productSearches, [index]: e.target.value })
                              updateItem(index, 'description', e.target.value)
                              setShowProductDropdown({ ...showProductDropdown, [index]: true })
                            }}
                            onFocus={() => setShowProductDropdown({ ...showProductDropdown, [index]: true })}
                            onBlur={() => {
                              setTimeout(() => setShowProductDropdown({ ...showProductDropdown, [index]: false }), 200)
                            }}
                            required
                          />
                          {showProductDropdown[index] && getFilteredProducts(index).length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {getFilteredProducts(index).map((product) => (
                                <div
                                  key={product.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleProductSelect(index, product)
                                  }}
                                >
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-600">{product.description} - {formatCurrency(product.price)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Rate</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate === 0 ? '' : item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
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

              {/* PDF Preview Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Invoice Preview</CardTitle>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  </div>
                </CardHeader>
                {showPreview && (
                  <CardContent>
                    <div className="border rounded-lg bg-white p-8 shadow-lg">
                      {/* Invoice Preview */}
                      <div className="max-w-2xl mx-auto">
                        <div className="border-b pb-4 mb-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-3xl font-bold mb-2">INVOICE</h2>
                              <p className="text-sm text-gray-600">Invoice #{formData.invoice_number}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Date: {formData.date || 'Not set'}</p>
                              <p className="text-sm text-gray-600">Due: {formData.due_date || 'Not set'}</p>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                                {formData.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bill To */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h3>
                          <p className="text-lg font-medium">{formData.customer_id || 'Customer Name'}</p>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                          <table className="w-full">
                            <thead className="border-b-2 border-gray-200">
                              <tr>
                                <th className="text-left py-2 text-sm font-semibold text-gray-600">DESCRIPTION</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-600">QTY</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-600">RATE</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-600">AMOUNT</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.filter(item => item.description).map((item, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                  <td className="py-3">{item.description}</td>
                                  <td className="text-right py-3">{item.quantity}</td>
                                  <td className="text-right py-3">{formatCurrency(item.rate)}</td>
                                  <td className="text-right py-3 font-medium">{formatCurrency(item.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-6">
                          <div className="w-64">
                            <div className="flex justify-between py-2 text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                              <span className="text-gray-600">VAT (14%):</span>
                              <span className="font-medium">{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-t-2 border-gray-200">
                              <span className="font-semibold text-lg">Total:</span>
                              <span className="font-bold text-xl">{formatCurrency(total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {formData.notes && (
                          <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">NOTES:</h3>
                            <p className="text-sm text-gray-700">{formData.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
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
                      Create Invoice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/invoices')}
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
