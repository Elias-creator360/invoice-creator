const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const initSqlJs = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Database instance
let db;
const DB_PATH = './database.db';

// Initialize Database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Vendors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Invoice items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vendor_id INTEGER,
      date DATE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      receipt_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
}

initDatabase();

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare('INSERT INTO users (email, password, company_name) VALUES (?, ?, ?)');
    const result = stmt.run(email, hashedPassword, companyName);
    
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, userId: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, userId: user.id });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
