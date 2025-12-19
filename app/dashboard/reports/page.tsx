'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, DollarSign, FileText, Download, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Mock data for demonstration
  const reportsData = {
    profitLoss: {
      revenue: 125000,
      expenses: 45000,
      profit: 80000
    },
    monthlyTrends: [
      { month: 'Jan', revenue: 98000, expenses: 42000 },
      { month: 'Feb', revenue: 105000, expenses: 38000 },
      { month: 'Mar', revenue: 115000, expenses: 41000 },
      { month: 'Apr', revenue: 125000, expenses: 45000 }
    ]
  }

  const reportTypes = [
    {
      title: 'Profit & Loss',
      description: 'Summary of income and expenses',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Cash Flow',
      description: 'Cash inflows and outflows',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Tax Summary',
      description: 'Tax calculations and reports',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-600 mt-1">Generate and view financial reports</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('month')}
        >
          This Month
        </Button>
        <Button
          variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('quarter')}
        >
          This Quarter
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('year')}
        >
          This Year
        </Button>
        <Button
          variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('custom')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Custom Range
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatCurrency(reportsData.profitLoss.revenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {formatCurrency(reportsData.profitLoss.expenses)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">+5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {formatCurrency(reportsData.profitLoss.profit)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600">+18% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <report.icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Revenue and expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportsData.monthlyTrends.map((data, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <span className="font-medium w-16">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="flex gap-2">
                    <div 
                      className="bg-green-200 h-8 rounded flex items-center justify-end px-2"
                      style={{ width: `${(data.revenue / 150000) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-green-800">{formatCurrency(data.revenue)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div 
                      className="bg-red-200 h-8 rounded flex items-center justify-end px-2"
                      style={{ width: `${(data.expenses / 150000) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-red-800">{formatCurrency(data.expenses)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right w-32">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(data.revenue - data.expenses)}
                  </div>
                  <div className="text-xs text-gray-500">Net</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 rounded"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
