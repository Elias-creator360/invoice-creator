const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from parent directory .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config(); // Also load from current directory if exists

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Initialize Supabase client with SERVICE ROLE KEY for backend operations
// Backend uses service role key to bypass RLS and perform admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  Supabase credentials not found in environment variables');
  console.error('Make sure .env.local exists in the parent directory with:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('Note: Backend uses SERVICE ROLE KEY, not anon key!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin middleware - only allows Admin users
function adminMiddleware(req, res, next) {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

// Admin middleware - only allows Admin users
function adminMiddleware(req, res, next) {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName, role = 'User' } = req.body;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
      
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert into Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        company_name: companyName,
        role,
        is_active: true
      }])
      .select()
      .single();
      
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const token = jwt.sign({ userId: newUser.id, role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, userId: newUser.id, role, email: newUser.email, companyName: newUser.company_name });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Query Supabase users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Update last login in Supabase
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    res.json({ 
      token, 
      userId: user.id, 
      role: user.role,
      email: user.email,
      companyName: user.company_name
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, company_name, role, is_active, last_login, created_at')
      .eq('id', req.userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout (client-side mainly, but we can track it)
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    // In a more complex system, you would invalidate the token here
    // For now, we just acknowledge the logout
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Customer routes
app.get('/api/customers', authMiddleware, (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', authMiddleware, (req, res) => {
  try {
    const { name, email, phone, address, city, state, zip } = req.body;
    const stmt = db.prepare('INSERT INTO customers (user_id, name, email, phone, address, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.userId, name, email, phone, address, city, state, zip);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/customers/:id', authMiddleware, (req, res) => {
  try {
    const { name, email, phone, address, city, state, zip } = req.body;
    const stmt = db.prepare('UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ? WHERE id = ? AND user_id = ?');
    stmt.run(name, email, phone, address, city, state, zip, req.params.id, req.userId);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Vendor routes
app.get('/api/vendors', authMiddleware, (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vendors', authMiddleware, (req, res) => {
  try {
    const { name, email, phone, address, city, state, zip } = req.body;
    const stmt = db.prepare('INSERT INTO vendors (user_id, name, email, phone, address, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.userId, name, email, phone, address, city, state, zip);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Invoice routes
app.get('/api/invoices', authMiddleware, (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      WHERE i.user_id = ? 
      ORDER BY i.created_at DESC
    `).all(req.userId);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', authMiddleware, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.address, c.city, c.state, c.zip
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      WHERE i.id = ? AND i.user_id = ?
    `).get(req.params.id, req.userId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    invoice.items = items;
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', authMiddleware, (req, res) => {
  try {
    const { customer_id, invoice_number, date, due_date, status, items, notes } = req.body;
    
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax example
    const total = subtotal + tax;
    
    db.prepare('BEGIN').run();
    
    try {
      const stmt = db.prepare('INSERT INTO invoices (user_id, customer_id, invoice_number, date, due_date, status, subtotal, tax, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const result = stmt.run(req.userId, customer_id, invoice_number, date, due_date, status || 'draft', subtotal, tax, total, notes);
      
      const invoiceId = result.lastInsertRowid;
      
      const itemStmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        itemStmt.run(invoiceId, item.description, item.quantity, item.rate, item.amount);
      }
      
      db.prepare('COMMIT').run();
      
      res.json({ id: invoiceId, invoice_number, subtotal, tax, total });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Expense routes
app.get('/api/expenses', authMiddleware, (req, res) => {
  try {
    const expenses = db.prepare(`
      SELECT e.*, v.name as vendor_name 
      FROM expenses e 
      LEFT JOIN vendors v ON e.vendor_id = v.id 
      WHERE e.user_id = ? 
      ORDER BY e.date DESC
    `).all(req.userId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', authMiddleware, (req, res) => {
  try {
    const { vendor_id, date, category, description, amount, payment_method } = req.body;
    const stmt = db.prepare('INSERT INTO expenses (user_id, vendor_id, date, category, description, amount, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.userId, vendor_id, date, category, description, amount, payment_method);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const totalRevenue = db.prepare('SELECT SUM(total) as total FROM invoices WHERE user_id = ? AND status = "paid"').get(req.userId);
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?').get(req.userId);
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(req.userId);
    const pendingInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "sent"').get(req.userId);
    
    res.json({
      revenue: totalRevenue.total || 0,
      expenses: totalExpenses.total || 0,
      profit: (totalRevenue.total || 0) - (totalExpenses.total || 0),
      customers: totalCustomers.count || 0,
      pendingInvoices: pendingInvoices.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent activity
app.get('/api/dashboard/activity', authMiddleware, (req, res) => {
  try {
    const recentInvoices = db.prepare(`
      SELECT 'invoice' as type, i.invoice_number as reference, i.total as amount, i.created_at as date, c.name as entity
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all(req.userId);
    
    const recentExpenses = db.prepare(`
      SELECT 'expense' as type, e.description as reference, e.amount, e.date, COALESCE(v.name, 'No vendor') as entity
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
      LIMIT 5
    `).all(req.userId);
    
    const activity = [...recentInvoices, ...recentExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN API ROUTES
// ============================================

// Get all users (Admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, company_name, role, is_active, last_login, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user details (Admin only)
app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, company_name, role, is_active, last_login, created_at')
      .eq('id', req.params.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (Admin only)
app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, password, companyName, role = 'User', isActive = true } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        first_name: firstName || null,
        last_name: lastName || null,
        email,
        password: hashedPassword,
        company_name: companyName || null,
        role,
        is_active: isActive
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      id: newUser.id, 
      email, 
      firstName,
      lastName,
      companyName, 
      role, 
      isActive,
      message: 'User created successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user (Admin only)
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, role, isActive, password } = req.body;
    const userId = req.params.id;
    
    // Build update object
    const updates = {};
    
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (email !== undefined) updates.email = email;
    if (companyName !== undefined) updates.company_name = companyName;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all roles
app.get('/api/admin/roles', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all distinct roles from role_permissions table
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('role');
    
    if (permError) throw permError;
    
    // Get unique roles
    const uniqueRoles = [...new Set(permissions?.map(p => p.role) || [])];
    
    // Get user counts
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role');
    
    if (userError) throw userError;
    
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    // Build roles array
    const roles = uniqueRoles.map((roleName, index) => {
      const isSystem = roleName === 'Admin' || roleName === 'User';
      return {
        id: index + 1,
        name: roleName,
        description: roleName === 'Admin' 
          ? 'Full system access with all permissions' 
          : roleName === 'User'
          ? 'Standard user with basic permissions'
          : `Custom role: ${roleName}`,
        is_system: isSystem ? 1 : 0,
        user_count: roleCounts[roleName] || 0,
        permission_count: 9, // All roles have access to all 9 features
        created_at: new Date().toISOString()
      };
    });
    
    // Sort so Admin and User are first
    roles.sort((a, b) => {
      if (a.name === 'Admin') return -1;
      if (b.name === 'Admin') return 1;
      if (a.name === 'User') return -1;
      if (b.name === 'User') return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single role details
app.get('/api/admin/roles/:nameOrId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const param = req.params.nameOrId;
    let roleName;
    
    // Check if param is a number (legacy ID-based request) or a string (role name)
    if (/^\d+$/.test(param)) {
      // Legacy: ID-based request
      const roleId = parseInt(param);
      const { data: allPermissions, error: allError } = await supabase
        .from('role_permissions')
        .select('role');
      
      if (allError) throw allError;
      
      const uniqueRoles = [...new Set(allPermissions?.map(p => p.role) || [])];
      uniqueRoles.sort((a, b) => {
        if (a === 'Admin') return -1;
        if (b === 'Admin') return 1;
        if (a === 'User') return -1;
        if (b === 'User') return 1;
        return a.localeCompare(b);
      });
      
      roleName = uniqueRoles[roleId - 1];
    } else {
      // New: Direct role name
      roleName = decodeURIComponent(param);
    }
    
    if (!roleName) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    console.log(`📖 Fetching details for role: "${roleName}"`);
    
    // Fetch permissions for this role from Supabase
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', roleName)
      .order('feature');
    
    if (error) throw error;
    
    console.log(`✅ Found ${permissions.length} permissions for role "${roleName}"`);
    
    // Format permissions to match expected structure
    const formattedPermissions = permissions.map((perm, index) => ({
      id: index + 1,
      page_name: perm.feature,
      page_path: perm.feature_path,
      description: `Access to ${perm.feature} feature`,
      access_level: perm.access_level
    }));
    
    const isSystem = roleName === 'Admin' || roleName === 'User';
    
    const role = {
      id: 1, // Not used anymore but kept for compatibility
      name: roleName,
      description: roleName === 'Admin' 
        ? 'Full system access with all permissions' 
        : roleName === 'User'
        ? 'Standard user with basic permissions'
        : `Custom role: ${roleName}`,
      is_system: isSystem ? 1 : 0,
      permissions: formattedPermissions
    };
    
    res.json(role);
  } catch (error) {
    console.error('❌ Error fetching role details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new role (Admin only)
app.post('/api/admin/roles', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role already exists
    const { data: existing } = await supabase
      .from('role_permissions')
      .select('role')
      .eq('role', name)
      .limit(1);
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Role already exists' });
    }
    
    // Create default permissions for the new role (all set to 'none')
    const features = [
      { feature: 'Dashboard', path: '/dashboard' },
      { feature: 'Customers', path: '/dashboard/customers' },
      { feature: 'Products', path: '/dashboard/products' },
      { feature: 'Invoices', path: '/dashboard/invoices' },
      { feature: 'Expenses', path: '/dashboard/expenses' },
      { feature: 'Vendors', path: '/dashboard/vendors' },
      { feature: 'Transactions', path: '/dashboard/transactions' },
      { feature: 'Reports', path: '/dashboard/reports' },
      { feature: 'Admin Panel', path: '/dashboard/admin' }
    ];
    
    const permissionsToInsert = features.map(f => ({
      role: name,
      feature: f.feature,
      feature_path: f.path,
      access_level: 'none'
    }));
    
    const { error } = await supabase
      .from('role_permissions')
      .insert(permissionsToInsert);
    
    if (error) throw error;
    
    res.json({ 
      message: 'Role created successfully',
      name,
      description
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update role (Admin only, cannot update system roles)
app.put('/api/admin/roles/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // For now, role descriptions are not stored separately
    // This endpoint mainly exists for future extensibility
    res.json({ message: 'Role names cannot be changed after creation. Modify permissions instead.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete role (Admin only, cannot delete system roles)
app.delete('/api/admin/roles/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Get all roles to map ID to role name
    const { data: allPermissions, error: rolesError } = await supabase
      .from('role_permissions')
      .select('role');
    
    if (rolesError) throw rolesError;
    
    const uniqueRoles = [...new Set(allPermissions?.map(p => p.role) || [])];
    uniqueRoles.sort((a, b) => {
      if (a === 'Admin') return -1;
      if (b === 'Admin') return 1;
      if (a === 'User') return -1;
      if (b === 'User') return 1;
      return a.localeCompare(b);
    });
    
    const roleName = uniqueRoles[roleId - 1];
    
    if (!roleName) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Don't allow deleting system roles
    if (roleName === 'Admin' || roleName === 'User') {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }
    
    // Delete all permissions for this role
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', roleName);
    
    if (error) throw error;
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all permissions
app.get('/api/admin/permissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all distinct features from role_permissions
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('feature, feature_path')
      .order('feature');
    
    if (error) throw error;
    
    // Remove duplicates and format
    const uniquePermissions = [];
    const seen = new Set();
    
    permissions.forEach(perm => {
      if (!seen.has(perm.feature)) {
        seen.add(perm.feature);
        uniquePermissions.push({
          id: uniquePermissions.length + 1,
          page_name: perm.feature,
          page_path: perm.feature_path,
          description: `Access to ${perm.feature} feature`
        });
      }
    });
    
    res.json(uniquePermissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update role permissions (Admin only)
app.put('/api/admin/roles/:nameOrId/permissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const param = req.params.nameOrId;
    const { permissions } = req.body; // Array of { feature_name, feature_path, access_level }
    
    console.log('📝 Updating permissions for role:', param);
    console.log('📋 Permissions received:', JSON.stringify(permissions, null, 2));
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    let roleName;
    
    // Check if param is a number (legacy ID-based request) or a string (role name)
    if (/^\d+$/.test(param)) {
      // Legacy: ID-based request - convert to role name
      const roleId = parseInt(param);
      const { data: allPermissions, error: rolesError } = await supabase
        .from('role_permissions')
        .select('role');
      
      if (rolesError) throw rolesError;
      
      const uniqueRoles = [...new Set(allPermissions?.map(p => p.role) || [])];
      uniqueRoles.sort((a, b) => {
        if (a === 'Admin') return -1;
        if (b === 'Admin') return 1;
        if (a === 'User') return -1;
        if (b === 'User') return 1;
        return a.localeCompare(b);
      });
      
      roleName = uniqueRoles[roleId - 1];
    } else {
      // New: Direct role name
      roleName = decodeURIComponent(param);
    }
    
    console.log('🎯 Target role name: "' + roleName + '"');
    
    if (!roleName) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Update each permission using role name + feature name directly
    let updateCount = 0;
    for (const perm of permissions) {
      if (!perm.feature_name || !perm.feature_path || !perm.access_level) {
        console.log(`⚠️ Skipping invalid permission:`, perm);
        continue;
      }
      
      console.log(`✏️ Updating: Role="${roleName}", Feature="${perm.feature_name}", Access="${perm.access_level}"`);
      
      // Upsert the permission based on role + feature name
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role: roleName,
          feature: perm.feature_name,
          feature_path: perm.feature_path,
          access_level: perm.access_level,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'role,feature'
        });
      
      if (error) {
        console.error(`❌ Error updating "${perm.feature_name}":`, error);
        throw error;
      }
      
      updateCount++;
      console.log(`✅ Successfully updated "${perm.feature_name}" to "${perm.access_level}"`);
    }
    
    console.log(`🎉 Total permissions updated: ${updateCount} for role "${roleName}"`);
    res.json({ message: `Successfully updated ${updateCount} permissions for role ${roleName}` });
  } catch (error) {
    console.error('❌ Error in permission update:', error);
    res.status(400).json({ error: error.message });
  }
});

// Assign roles to user (Admin only)
app.post('/api/admin/users/:id/roles', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userId = req.params.id;
    const { roleIds } = req.body; // Array of role IDs
    
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'roleIds must be an array' });
    }
    
    // Delete existing role assignments
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
    
    // Assign new roles
    const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)');
    roleIds.forEach(roleId => {
      stmt.run(userId, roleId, req.userId);
    });
    
    res.json({ message: 'User roles updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user permissions
app.get('/api/auth/permissions', authMiddleware, async (req, res) => {
  try {
    // Get user data to check role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', req.userId)
      .single();

    if (userError) throw userError;

    console.log(`🔍 Fetching permissions for user:`, { id: user.id, email: user.email, role: user.role });

    // If user is Admin (legacy role field), give full access to everything
    if (user && user.role === 'Admin') {
      // Get all features from role_permissions
      const { data: features } = await supabase
        .from('role_permissions')
        .select('feature, feature_path')
        .eq('role', 'Admin');
      
      if (features && features.length > 0) {
        // Remove duplicates
        const uniqueFeatures = [];
        const seen = new Set();
        features.forEach(f => {
          if (!seen.has(f.feature)) {
            seen.add(f.feature);
            uniqueFeatures.push({
              page_name: f.feature,
              page_path: f.feature_path,
              access_level: 'edit'
            });
          }
        });
        console.log(`✅ Admin user - returning ${uniqueFeatures.length} features`);
        return res.json(uniqueFeatures);
      }
    }

    // For regular users, get permissions based on their role
    // First, get the user's role from the users table
    const userRole = user?.role || 'User';

    console.log(`🔑 Querying permissions for role: "${userRole}"`);

    // Get permissions for this role from role_permissions table
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select('feature, feature_path, access_level')
      .eq('role', userRole);

    if (permError) throw permError;

    console.log(`📊 Found ${rolePermissions?.length || 0} permissions for role "${userRole}"`);
    console.log(`📋 Permissions:`, rolePermissions);

    // Format the permissions
    const formattedPermissions = rolePermissions.map(perm => ({
      page_name: perm.feature,
      page_path: perm.feature_path,
      access_level: perm.access_level
    }));

    res.json(formattedPermissions);
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check database state (Admin only)
app.get('/api/admin/debug/permissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all role_permissions
    const { data: allPerms, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role')
      .order('feature');

    if (error) throw error;

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role');

    res.json({
      permissions: allPerms,
      users: users,
      uniqueRoles: [...new Set(allPerms.map(p => p.role))]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Connected to Supabase at ${supabaseUrl}`);
});
