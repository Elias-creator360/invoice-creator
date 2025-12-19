# Supabase Database Setup Guide

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase
3. Get your project URL and anon key from Project Settings > API

## Environment Variables
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

Run these SQL commands in your Supabase SQL Editor (Tools > SQL Editor):

### 1. Enable UUID Extension (if not already enabled)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Create Customers Table
```sql
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospective', 'tentative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
```

### 3. Create Vendors Table
```sql
CREATE TABLE vendors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_email ON vendors(email);
```

### 4. Create Products Table
```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  sku TEXT UNIQUE,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
```

### 5. Create Expenses Table
```sql
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 6. Create Invoices Table
```sql
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
```

### 7. Create Transactions Table
```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### 8. Enable Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allowing all operations for development
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
```

### 9. Create Updated_at Trigger Function
```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 10. Insert Sample Data (Optional)
```sql
-- Sample Customers
INSERT INTO customers (name, email, phone, address, city, state, zip, status) VALUES
('Acme Corporation', 'contact@acme.com', '555-0101', '123 Business St', 'New York', 'NY', '10001', 'active'),
('TechStart LLC', 'hello@techstart.io', '555-0102', '456 Innovation Ave', 'San Francisco', 'CA', '94102', 'prospective'),
('Global Industries', 'info@global.com', '555-0103', '789 Enterprise Blvd', 'Chicago', 'IL', '60601', 'active');

-- Sample Vendors
INSERT INTO vendors (name, email, phone, address, city, state, zip) VALUES
('Office Depot', 'contact@officedepot.com', '555-0201', '789 Supplier St', 'New York', 'NY', '10001'),
('Staples Inc', 'info@staples.com', '555-0202', '456 Vendor Ave', 'Boston', 'MA', '02101'),
('Tech Supplies Co', 'sales@techsupplies.com', '555-0203', '321 Merchant Rd', 'Seattle', 'WA', '98101');

-- Sample Products
INSERT INTO products (name, description, price, category, sku, stock) VALUES
('Web Development Package', 'Complete website development service', 5000.00, 'Services', 'WEB-001', 999),
('Monthly Maintenance', 'Website maintenance and updates', 500.00, 'Services', 'MAINT-001', 999),
('Custom Design', 'Custom graphic design services', 1500.00, 'Design', 'DES-001', 999),
('SEO Optimization', 'Search engine optimization package', 2000.00, 'Marketing', 'SEO-001', 999);
```

## Verification
After running the SQL scripts:
1. Go to Supabase Dashboard > Table Editor
2. Verify all tables are created
3. Check that sample data is populated (if you ran the optional step)
4. Test the application to ensure CRUD operations work

## Notes
- The RLS policies are currently set to allow all operations for development
- For production, implement proper authentication and update RLS policies
- Make sure to backup your data regularly
- Update indexes as your query patterns evolve
