'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp,
  Building2,
  Receipt,
  Package
} from 'lucide-react'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Customers', icon: Users, href: '/dashboard/customers' },
    { name: 'Products', icon: Package, href: '/dashboard/products' },
    { name: 'Invoices', icon: FileText, href: '/dashboard/invoices' },
    { name: 'Expenses', icon: Receipt, href: '/dashboard/expenses' },
    { name: 'Vendors', icon: Building2, href: '/dashboard/vendors' },
    { name: 'Transactions', icon: CreditCard, href: '/dashboard/transactions' },
    { name: 'Reports', icon: TrendingUp, href: '/dashboard/reports' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold">Benab Invoices</h1>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive(item.href) 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                  : ''
              }`}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
