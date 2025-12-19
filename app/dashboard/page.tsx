'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Receipt,
  Building2,
  DollarSign,
  Activity,
  TrendingUp
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { customersApi, invoicesApi, expensesApi } from '@/lib/api'
import type { Invoice, Expense, Customer } from '@/lib/supabase'

interface Stats {
  revenue: number
  expenses: number
  profit: number
  customers: number
  pendingInvoices: number
}

interface RecentActivity {
  id: string
  type: 'invoice' | 'expense' | 'customer'
  title: string
  subtitle: string
  amount?: number
  date: string
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    customers: 0,
    pendingInvoices: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [invoices, expenses, customers] = await Promise.all([
        invoicesApi.getAll(),
        expensesApi.getAll(),
        customersApi.getAll()
      ])

      // Calculate stats
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0)
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      const pendingCount = invoices.filter(
        inv => inv.status === 'sent' || inv.status === 'draft'
      ).length

      setStats({
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        customers: customers.length,
        pendingInvoices: pendingCount
      })

      // Build recent activity from invoices, expenses, and customers
      const activities: RecentActivity[] = []

      // Add recent paid invoices
      invoices
        .filter(inv => inv.status === 'paid')
        .slice(0, 3)
        .forEach(inv => {
          activities.push({
            id: `invoice-${inv.id}`,
            type: 'invoice',
            title: `Invoice ${inv.invoice_number} paid`,
            subtitle: inv.customer_name || 'Customer',
            amount: inv.total,
            date: inv.date
          })
        })

      // Add recent expenses
      expenses
        .slice(0, 2)
        .forEach(exp => {
          activities.push({
            id: `expense-${exp.id}`,
            type: 'expense',
            title: exp.description || exp.category,
            subtitle: exp.vendor_name,
            amount: -exp.amount,
            date: exp.date
          })
        })

      // Add recent customers
      customers
        .slice(0, 2)
        .forEach(cust => {
          activities.push({
            id: `customer-${cust.id}`,
            type: 'customer',
            title: 'New customer added',
            subtitle: cust.name,
            date: cust.created_at || new Date().toISOString()
          })
        })

      // Sort by date and take top 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activities.slice(0, 5))

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.expenses)}</div>
              <p className="text-xs text-red-600 mt-1">+5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.profit)}</div>
              <p className="text-xs text-blue-600 mt-1">+18% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-purple-600 mt-1">{stats.pendingInvoices} pending invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to manage your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/invoices/new')}>
                <FileText className="mr-2 h-4 w-4" />
                Create New Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/expenses?new=true')}>
                <Receipt className="mr-2 h-4 w-4" />
                Record Expense
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/customers?new=true')}>
                <Users className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/vendors?new=true')}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-center justify-between ${index < recentActivity.length - 1 ? 'border-b pb-3' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.type === 'invoice' ? 'bg-green-100' :
                          activity.type === 'expense' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.type === 'invoice' && <FileText className="h-4 w-4 text-green-600" />}
                          {activity.type === 'expense' && <Receipt className="h-4 w-4 text-red-600" />}
                          {activity.type === 'customer' && <Users className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.subtitle}</p>
                        </div>
                      </div>
                      {activity.amount !== undefined ? (
                        <span className={`text-sm font-semibold ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                        </span>
                      ) : (
                        <Activity className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
