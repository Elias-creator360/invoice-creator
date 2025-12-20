// Script to create admin user in Supabase
// This generates the SQL with hashed password

const bcrypt = require('bcryptjs');

const email = 'eliasjah330@gmail.com';
const password = 'Password1234#';
const companyName = 'Benab Invoices';
const role = 'Admin';

async function generateAdminUserSQL() {
  console.log('\n🔐 Generating Admin User SQL...\n');
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('Copy and paste this SQL into your Supabase SQL Editor:\n');
  console.log('-----------------------------------------------------------');
  console.log(`
-- Create Admin User: ${email}
INSERT INTO users (email, password, company_name, role, is_active, created_at, updated_at)
VALUES (
  '${email}',
  '${hashedPassword}',
  '${companyName}',
  '${role}',
  true,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, email, company_name, role, is_active, created_at FROM users WHERE email = '${email}';
`);
  console.log('-----------------------------------------------------------\n');
  console.log('✅ SQL generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to Supabase Dashboard → SQL Editor');
  console.log('3. Paste and execute the SQL');
  console.log('4. Login with: ' + email + '\n');
}

generateAdminUserSQL().catch(console.error);
