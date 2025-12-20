import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  console.warn('⚠️  The application will not function properly without valid Supabase credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  status: 'active' | 'inactive' | 'prospective' | 'tentative'
  created_at?: string
  updated_at?: string
}

export interface Vendor {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock: number
  created_at?: string
  updated_at?: string
}

export interface Expense {
  id: number
  date: string
  vendor_name: string
  category: string
  description: string
  amount: number
  payment_method: string
  created_at?: string
  updated_at?: string
}

export interface InvoiceItem {
  product_id?: number
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: number
  invoice_number: string
  customer_id: number
  customer_name?: string
  date: string
  due_date: string
  items: InvoiceItem[] | string
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Transaction {
  id: number
  date: string
  description: string
  type: 'income' | 'expense'
  category: string
  amount: number
  balance: number
  created_at?: string
  updated_at?: string
}
