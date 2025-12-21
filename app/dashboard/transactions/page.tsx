'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PermissionGuard } from '@/components/PermissionGuard'

interface Transaction {
  id: number
  date: string
  description: string
  type: 'income' | 'expense'
  category: string
  amount: number
  balance: number
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data for demonstration
    const mockTransactions = [
      { id: 1, date: '2024-12-18', description: 'Invoice Payment - Acme Corp', type: 'income' as const, category: 'Sales', amount: 5000, balance: 15000 },
      { id: 2, date: '2024-12-17', description: 'Office Supplies - Staples', type: 'expense' as const, category: 'Office Supplies', amount: 234.50, balance: 10000 },
      { id: 3, date: '2024-12-16', description: 'Cloud Hosting - AWS', type: 'expense' as const, category: 'Technology', amount: 450, balance: 10234.50 },
      { id: 4, date: '2024-12-15', description: 'Invoice Payment - TechStart LLC', type: 'income' as const, category: 'Sales', amount: 3500, balance: 10684.50 },
      { id: 5, date: '2024-12-14', description: 'Salary Payment', type: 'expense' as const, category: 'Payroll', amount: 2500, balance: 7184.50 },
      { id: 6, date: '2024-12-13', description: 'Consulting Services', type: 'income' as const, category: 'Services', amount: 1200, balance: 9684.50 }
    ]
    setTransactions(mockTransactions)
  }, [])

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpense

  return (
    <PermissionGuard pagePath="/dashboard/transactions">
      <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Transactions</h2>
        <p className="text-gray-600 mt-1">View all your financial transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(totalExpense)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {formatCurrency(netBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Transactions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === 'income' ? (
                        <>
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Income</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium">Expense</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.balance)}
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
