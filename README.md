# QuickBooks Clone - Accounting Software

A full-featured accounting and business management application built with Next.js, Node.js, and SQLite. This application provides similar functionality to QuickBooks Online, including invoicing, expense tracking, customer management, and financial reporting.

## Features

### Core Functionality
- 📊 **Dashboard** - Real-time business overview with key metrics
- 👥 **Customer Management** - Track and manage customer information
- 📄 **Invoice Management** - Create, send, and track invoices
- 💰 **Expense Tracking** - Record and categorize business expenses
- 🏢 **Vendor Management** - Manage vendor relationships
- 💳 **Transaction Tracking** - Monitor all financial transactions
- 📈 **Financial Reports** - Generate P&L, balance sheets, and more
- 🔐 **Authentication** - Secure user authentication with JWT

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites
- Node.js 18+ installed on your system
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```powershell
   npm install
   ```

2. **Environment Variables**
   The `.env` file is already created with default values:
   ```
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   API_URL=http://localhost:3001
   ```
   
   ⚠️ **Important**: Change the `JWT_SECRET` to a secure random string in production!

3. **Database Setup**
   The SQLite database will be automatically created when you first run the backend server. No additional setup is required!
   
   The database file (`database.db`) will be created in the root directory with the following tables:
   - `users` - User accounts
   - `customers` - Customer information
   - `vendors` - Vendor information
   - `invoices` - Invoice records
   - `invoice_items` - Line items for invoices
   - `expenses` - Expense records
   - `transactions` - All financial transactions

### Running the Application

You need to run both the frontend and backend servers:

#### Option 1: Run in Separate Terminals

**Terminal 1 - Frontend (Next.js)**
```powershell
npm run dev
```
The frontend will run on http://localhost:3000

**Terminal 2 - Backend (Node.js)**
```powershell
npm run server
```
The backend API will run on http://localhost:3001

#### Option 2: Use Development Mode with Auto-Reload

For backend development with auto-reload:
```powershell
npm run server:dev
```

### Accessing the Application

1. Open your browser and navigate to http://localhost:3000
2. You'll see the landing page with a "Go to Dashboard" button
3. Click to access the dashboard and start using the application

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── dashboard/               # Dashboard pages
│   │   ├── customers/          # Customer management
│   │   ├── invoices/           # Invoice management
│   │   │   └── new/           # Create new invoice
│   │   └── expenses/           # Expense tracking
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── backend/                     # Backend API
│   └── server.js               # Express server with all routes
├── components/                  # React components
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── table.tsx
├── lib/                        # Utility functions
│   └── utils.ts               # Helper functions
├── .env                        # Environment variables
├── package.json                # Dependencies
├── tailwind.config.js         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices` - Create new invoice

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense

### Vendors
- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create new vendor

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

## Database Information

### SQLite Database
This application uses **SQLite** as the local database. Here's what you need to know:

#### No Installation Required
SQLite is a serverless, file-based database. The `better-sqlite3` npm package is already included in the dependencies, so no separate database installation is needed!

#### Database File Location
The database file `database.db` will be automatically created in the root directory of your project when you first start the backend server.

#### Database Management
- The database is automatically initialized with all necessary tables
- Data persists between server restarts
- The database file is a single file that contains all your data

#### Viewing/Managing the Database (Optional)
If you want to view or manage the database directly, you can use:
- [DB Browser for SQLite](https://sqlitebrowser.org/) - Free GUI tool
- [SQLite CLI](https://www.sqlite.org/cli.html) - Command-line interface
- VS Code extensions like "SQLite" or "SQLite Viewer"

#### Backup Your Database
To backup your data, simply copy the `database.db` file to a safe location.

## Features by Module

### Dashboard
- Revenue, expenses, and profit overview
- Customer count and pending invoices
- Quick action buttons
- Recent activity feed
- Visual statistics cards

### Customer Management
- Add, edit, and delete customers
- Store contact information and addresses
- Search and filter customers
- View customer details

### Invoice Management
- Create professional invoices
- Track invoice status (draft, sent, paid, overdue)
- Add multiple line items
- Automatic tax calculation
- Invoice numbering system
- Customer-linked invoices

### Expense Tracking
- Record business expenses
- Categorize expenses
- Link to vendors
- Track payment methods
- Search and filter expenses
- Total expense calculation

## Development

### Adding New Features
The codebase is structured to make it easy to add new features:

1. **Frontend Pages**: Add new pages in `app/dashboard/`
2. **Backend Routes**: Add new routes in `backend/server.js`
3. **UI Components**: Use shadcn/ui components from `components/ui/`
4. **Database Tables**: Add new tables in the `initDatabase()` function

### Customization
- **Styling**: Modify `tailwind.config.js` and `app/globals.css`
- **Colors**: Update theme colors in `app/globals.css`
- **Tax Rate**: Change tax calculation in invoice creation logic
- **Date Formats**: Modify the utility functions in `lib/utils.ts`

## Security Notes

⚠️ **Important Security Considerations**:

1. **Change JWT Secret**: Update the `JWT_SECRET` in `.env` before deploying
2. **Add Authentication**: The current demo uses mock data; implement proper authentication
3. **Input Validation**: Add server-side validation for all inputs
4. **HTTPS**: Use HTTPS in production
5. **Environment Variables**: Never commit sensitive data to version control

## Troubleshooting

### Database Issues
- If the database isn't created, ensure you have write permissions in the project directory
- Delete `database.db` and restart the backend to recreate the database

### Port Conflicts
- If port 3000 or 3001 is in use, modify the ports in `.env` and `next.config.js`

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed
- Check that you're running Node.js 18 or higher

## Next Steps

To enhance this application, consider adding:
- [ ] Payment processing integration
- [ ] PDF invoice generation
- [ ] Email sending for invoices
- [ ] Advanced reporting with charts
- [ ] Multi-user support with roles
- [ ] Recurring invoices
- [ ] Inventory management
- [ ] Time tracking
- [ ] Tax calculation tools
- [ ] Data export (CSV, Excel)

## License

This project is for educational purposes.

## Support

For issues or questions, please check the troubleshooting section or review the code comments.
