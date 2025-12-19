# 🚀 QUICK START GUIDE

## Installation & Setup (3 Simple Steps!)

### Step 1: Install Dependencies
Open PowerShell in the project directory and run:
```powershell
npm install
```

### Step 2: Start the Backend Server
In the same PowerShell window:
```powershell
npm run server
```

You should see:
```
Database initialized successfully
Server running on port 3001
```

### Step 3: Start the Frontend (New Terminal)
Open a NEW PowerShell window in the same directory and run:
```powershell
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
```

## 🎉 You're Ready!

Open your browser and go to: **http://localhost:3000**

---

## ⚡ What You Need to Know About the Database

### No Installation Required!
- SQLite is already included in the dependencies
- The database file (`database.db`) will be created automatically when you first start the backend server
- No configuration needed - it just works!

### Where is the database?
- It's a file called `database.db` in your project root directory
- This file is created automatically the first time you run `npm run server`
- All your data is stored in this single file

### Do I need to do anything?
**No!** Just run the backend server and the database is ready to use.

---

## 📋 Available Features

1. **Dashboard** - http://localhost:3000/dashboard
   - View revenue, expenses, and profit
   - See customer count and pending invoices
   - Quick actions for common tasks

2. **Customers** - http://localhost:3000/dashboard/customers
   - Add, edit, and delete customers
   - Search and manage customer information

3. **Invoices** - http://localhost:3000/dashboard/invoices
   - Create professional invoices
   - Track invoice status (draft, sent, paid, overdue)
   - View invoice details

4. **Expenses** - http://localhost:3000/dashboard/expenses
   - Record business expenses
   - Categorize and track spending
   - Link expenses to vendors

---

## 🔧 Common Commands

```powershell
# Install dependencies
npm install

# Run frontend (Next.js)
npm run dev

# Run backend (Node.js)
npm run server

# Run backend with auto-reload during development
npm run server:dev

# Build for production
npm run build

# Start production server
npm start
```

---

## ❓ Troubleshooting

### "Port 3000 already in use"
Another application is using port 3000. Close it or change the Next.js port:
```powershell
# Run on a different port
$env:PORT=3002; npm run dev
```

### "Port 3001 already in use"
Change the backend port in `.env` file:
```
PORT=3002
```

### "Cannot find module..."
Install dependencies:
```powershell
npm install
```

### Database not creating
- Check you have write permissions in the project folder
- Try deleting `database.db` (if it exists) and restart the backend server

---

## 📁 Project Structure

```
your-project/
├── app/                    # Next.js frontend pages
│   ├── dashboard/         # All dashboard pages
│   └── page.tsx          # Home page
├── backend/
│   └── server.js         # Backend API (all routes)
├── components/ui/         # UI components (shadcn)
├── database.db           # SQLite database (auto-created)
├── .env                  # Environment variables
└── package.json          # Dependencies
```

---

## 🎯 Next Steps

1. **Explore the Dashboard** - Click around and see all the features
2. **Add a Customer** - Go to Customers and click "Add Customer"
3. **Create an Invoice** - Go to Invoices and click "Create Invoice"
4. **Track Expenses** - Go to Expenses and record a business expense

---

## 🔒 Security Note

Before deploying to production:
1. Change `JWT_SECRET` in `.env` to a secure random string
2. Set up proper authentication
3. Use HTTPS
4. Add input validation

---

## 💡 Tips

- The app uses mock data initially - data you create is stored in the SQLite database
- To reset the database, delete `database.db` and restart the backend
- Both frontend and backend must be running for the app to work fully
- The UI is fully responsive and works on mobile devices

---

## 🆘 Need Help?

1. Check the main README.md for detailed documentation
2. Review the troubleshooting section above
3. Check the code comments in the source files
4. Ensure both frontend and backend servers are running

---

**Happy Accounting! 📊💼**
