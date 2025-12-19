'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Printer, Mail, Edit } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import { invoicesApi } from '@/lib/api'
import type { Invoice } from '@/lib/supabase'

export default function InvoiceViewPage() {
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      const invoiceId = parseInt(params.id as string)
      const data = await invoicesApi.getById(invoiceId)
      setInvoice(data)
    } catch (err) {
      setError('Failed to load invoice.')
      console.error('Error loading invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading invoice...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-8">
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error || 'Invoice not found'}</p>
        </div>
        <Button onClick={() => router.push('/dashboard/invoices')}>Back to Invoices</Button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!invoice) return
    
    // Create PDF
    const doc = new jsPDF()
    
    // Set up fonts and colors
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 20, 20)
    
    // Invoice details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 35)
    doc.text(`Date: ${formatDate(invoice.date)}`, 20, 42)
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 20, 49)
    
    // Status
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 35)
    
    // Bill To
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BILL TO:', 20, 65)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.customer_name, 20, 73)
    
    // Table headers
    let yPos = 95
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPTION', 20, yPos)
    doc.text('QTY', 120, yPos, { align: 'right' })
    doc.text('RATE', 150, yPos, { align: 'right' })
    doc.text('AMOUNT', 190, yPos, { align: 'right' })
    
    // Draw line under headers
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPos + 2, 190, yPos + 2)
    
    // Items
    yPos += 10
    doc.setFont('helvetica', 'normal')
    invoice.items.forEach((item) => {
      doc.text(item.description, 20, yPos)
      doc.text(item.quantity.toString(), 120, yPos, { align: 'right' })
      doc.text(formatCurrency(item.rate), 150, yPos, { align: 'right' })
      doc.text(formatCurrency(item.amount), 190, yPos, { align: 'right' })
      yPos += 8
    })
    
    // Draw line before totals
    yPos += 5
    doc.line(120, yPos, 190, yPos)
    
    // Totals
    yPos += 8
    doc.text('Subtotal:', 120, yPos)
    doc.text(formatCurrency(invoice.subtotal), 190, yPos, { align: 'right' })
    
    yPos += 7
    doc.text('VAT (14%):', 120, yPos)
    doc.text(formatCurrency(invoice.tax), 190, yPos, { align: 'right' })
    
    yPos += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', 120, yPos)
    doc.text(formatCurrency(invoice.total), 190, yPos, { align: 'right' })
    
    // Notes
    if (invoice.notes) {
      yPos += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTES:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(invoice.notes, 170)
      doc.text(splitNotes, 20, yPos + 7)
    }
    
    // Save the PDF
    doc.save(`${invoice.invoice_number}.pdf`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return
    
    try {
      await invoicesApi.updateStatus(invoice.id, newStatus as Invoice['status'])
      // Update local state
      setInvoice({ ...invoice, status: newStatus as Invoice['status'] })
    } catch (error) {
      console.error('Error updating invoice status:', error)
      alert('Failed to update invoice status')
    }
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
