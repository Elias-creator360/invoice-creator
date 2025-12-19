'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Printer, Mail, Edit } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  date: string
  due_date: string
  status: string
  notes?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
}

export default function InvoiceViewPage() {
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    // Load invoice from localStorage
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const foundInvoice = invoices.find((inv: Invoice) => inv.id.toString() === params.id)
    if (foundInvoice) {
      setInvoice(foundInvoice)
    }
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a simple text version for download
    if (!invoice) return
    
    const content = `
INVOICE
Invoice #: ${invoice.invoice_number}
Date: ${formatDate(invoice.date)}
Due Date: ${formatDate(invoice.due_date)}

Bill To:
${invoice.customer_name}

ITEMS:
${invoice.items.map(item => 
  `${item.description} - Qty: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
).join('\n')}

Subtotal: ${formatCurrency(invoice.subtotal)}
VAT (14%): ${formatCurrency(invoice.tax)}
TOTAL: ${formatCurrency(invoice.total)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}
    `

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleStatusChange = (newStatus: string) => {
    if (!invoice) return
    
    // Update local state
    const updatedInvoice = { ...invoice, status: newStatus }
    setInvoice(updatedInvoice)
    
    // Update in localStorage
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const updatedInvoices = invoices.map((inv: Invoice) => 
      inv.id === invoice.id ? updatedInvoice : inv
    )
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invoice not found</h2>
          <Button onClick={() => router.push('/dashboard/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
        {/* Action Buttons */}
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <Button onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        </div>

        {/* Invoice Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">INVOICE</CardTitle>
                <p className="text-sm text-gray-600">Invoice #{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date: {formatDate(invoice.date)}</p>
                <p className="text-sm text-gray-600">Due: {formatDate(invoice.due_date)}</p>
                <div className="mt-2 print:hidden">
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(invoice.status)}`}
                  >
                    <option value="draft">DRAFT</option>
                    <option value="sent">SENT</option>
                    <option value="paid">PAID</option>
                    <option value="overdue">OVERDUE</option>
                  </select>
                </div>
                <span className="hidden print:inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}">
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h3>
              <p className="text-lg font-medium">{invoice.customer_name}</p>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">DESCRIPTION</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">QTY</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">RATE</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4">{item.description}</td>
                      <td className="text-right py-4">{item.quantity}</td>
                      <td className="text-right py-4">{formatCurrency(item.rate)}</td>
                      <td className="text-right py-4 font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">VAT (14%):</span>
                  <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-200">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-xl">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">NOTES:</h3>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6 flex justify-center print:hidden">
          <Button variant="outline" onClick={() => router.push('/dashboard/invoices')}>
            Back to Invoices
          </Button>
        </div>
    </div>
  )
}
