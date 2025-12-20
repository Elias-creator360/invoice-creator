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
    
    // Validate role
    if (!['Admin', 'User'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin or User' });
    }
    
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
      .select('id, email, company_name, role, is_active, last_login, created_at')
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
app.get('/api/admin/roles', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const roles = db.prepare(`
      SELECT 
        r.*,
        COUNT(DISTINCT ur.user_id) as user_count,
        COUNT(DISTINCT rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.created_at DESC
    `).all();
    
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single role details
app.get('/api/admin/roles/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Get role permissions
    const permissions = db.prepare(`
      SELECT p.*, rp.access_level
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
    `).all(req.params.id);
    
    role.permissions = permissions;
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new role (Admin only)
app.post('/api/admin/roles', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    const stmt = db.prepare('INSERT INTO roles (name, description, is_system) VALUES (?, ?, 0)');
    const result = stmt.run(name, description || '');
    
    res.json({ 
      id: result.lastInsertRowid, 
      name, 
      description,
      message: 'Role created successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update role (Admin only, cannot update system roles)
app.put('/api/admin/roles/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const roleId = req.params.id;
    const { name, description } = req.body;
    
    // Check if it's a system role
    const role = db.prepare('SELECT is_system FROM roles WHERE id = ?').get(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (role.is_system === 1) {
      return res.status(400).json({ error: 'Cannot modify system roles' });
    }
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(roleId);
    const query = `UPDATE roles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.prepare(query).run(...values);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete role (Admin only, cannot delete system roles)
app.delete('/api/admin/roles/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const roleId = req.params.id;
    
    const role = db.prepare('SELECT is_system FROM roles WHERE id = ?').get(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (role.is_system === 1) {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }
    
    db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all permissions
app.get('/api/admin/permissions', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const permissions = db.prepare('SELECT * FROM permissions ORDER BY page_name').all();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update role permissions (Admin only)
app.put('/api/admin/roles/:id/permissions', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const roleId = req.params.id;
    const { permissions } = req.body; // Array of { permission_id, access_level }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    // Delete existing permissions for this role
    db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
    
    // Insert new permissions
    const stmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id, access_level) VALUES (?, ?, ?)');
    permissions.forEach(perm => {
      if (perm.access_level !== 'none') {
        stmt.run(roleId, perm.permission_id, perm.access_level);
      }
    });
    
    res.json({ message: 'Role permissions updated successfully' });
  } catch (error) {
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
app.get('/api/auth/permissions', authMiddleware, (req, res) => {
  try {
    const permissions = db.prepare(`
      SELECT DISTINCT
        p.page_name,
        p.page_path,
        MAX(
          CASE rp.access_level
            WHEN 'edit' THEN 3
            WHEN 'view' THEN 2
            WHEN 'none' THEN 1
            ELSE 0
          END
        ) as access_level_num
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      GROUP BY p.id, p.page_name, p.page_path
    `).all(req.userId);
    
    // Convert numeric access level back to string
    const formattedPermissions = permissions.map(perm => ({
      page_name: perm.page_name,
      page_path: perm.page_path,
      access_level: perm.access_level_num === 3 ? 'edit' : perm.access_level_num === 2 ? 'view' : 'none'
    }));
    
    // If user is Admin (legacy role field), give full access
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
    if (user && user.role === 'Admin') {
      const allPermissions = db.prepare('SELECT page_name, page_path FROM permissions').all();
      return res.json(allPermissions.map(p => ({ ...p, access_level: 'edit' })));
    }
    
    res.json(formattedPermissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Connected to Supabase at ${supabaseUrl}`);
});
