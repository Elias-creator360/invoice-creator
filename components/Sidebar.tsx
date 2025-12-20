'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp,
  Building2,
  Receipt,
  Package,
  LogOut,
  User,
  Settings
} from 'lucide-react'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

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

  // Add Admin Panel link only for Admin users
  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', icon: Settings, href: '/dashboard/admin' })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 flex-1">
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

      {/* User Info and Logout */}
      <div className="p-6 border-t border-gray-200">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="text-xs text-gray-600">{user?.companyName}</div>
          <div className="mt-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              user?.role === 'Admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
