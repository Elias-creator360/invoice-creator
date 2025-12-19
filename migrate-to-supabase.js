// LocalStorage to Supabase Migration Script
// Run this in your browser console on http://localhost:3000

async function migrateLocalStorageToSupabase() {
  console.log('🚀 Starting migration from localStorage to Supabase...\n');
  
  // Extract data from localStorage
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
  
  console.log('📊 Found data in localStorage:');
  console.log(`  - ${customers.length} customers`);
  console.log(`  - ${vendors.length} vendors`);
  console.log(`  - ${products.length} products`);
  console.log(`  - ${invoices.length} invoices\n`);
  
  // Import Supabase (if running in browser with app loaded)
  const { customersApi, vendorsApi, productsApi, invoicesApi } = window;
  
  if (!customersApi) {
    console.error('❌ API not found. Please make sure you are on the app page and it has loaded.');
    console.log('\n📝 Manual Migration Instructions:');
    console.log('Copy the data below and paste it in Supabase Table Editor:\n');
    console.log('CUSTOMERS:');
    console.log(JSON.stringify(customers, null, 2));
    console.log('\nVENDORS:');
    console.log(JSON.stringify(vendors, null, 2));
    console.log('\nPRODUCTS:');
    console.log(JSON.stringify(products, null, 2));
    console.log('\nINVOICES:');
    console.log(JSON.stringify(invoices, null, 2));
    return;
  }
  
  let stats = {
    customers: { success: 0, failed: 0 },
    vendors: { success: 0, failed: 0 },
    products: { success: 0, failed: 0 },
    invoices: { success: 0, failed: 0 }
  };
  
  // Migrate Customers
  console.log('📤 Migrating customers...');
  for (const customer of customers) {
    try {
      const { id, ...customerData } = customer; // Remove old ID
      await customersApi.create(customerData);
      stats.customers.success++;
    } catch (error) {
      console.error(`Failed to migrate customer: ${customer.name}`, error);
      stats.customers.failed++;
    }
  }
  
  // Migrate Vendors
  console.log('📤 Migrating vendors...');
  for (const vendor of vendors) {
    try {
      const { id, ...vendorData } = vendor;
      await vendorsApi.create(vendorData);
      stats.vendors.success++;
    } catch (error) {
      console.error(`Failed to migrate vendor: ${vendor.name}`, error);
      stats.vendors.failed++;
    }
  }
  
  // Migrate Products
  console.log('📤 Migrating products...');
  for (const product of products) {
    try {
      const { id, ...productData } = product;
      // Add default values for new fields
      const fullProductData = {
        ...productData,
        sku: productData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        stock: productData.stock || 0
      };
      await productsApi.create(fullProductData);
      stats.products.success++;
    } catch (error) {
      console.error(`Failed to migrate product: ${product.name}`, error);
      stats.products.failed++;
    }
  }
  
  // Get new customer IDs mapping
  const newCustomers = await customersApi.getAll();
  const customerMapping = {};
  customers.forEach((oldCustomer) => {
    const newCustomer = newCustomers.find(c => c.email === oldCustomer.email);
    if (newCustomer) {
      customerMapping[oldCustomer.id] = newCustomer.id;
    }
  });
  
  // Migrate Invoices
  console.log('📤 Migrating invoices...');
  for (const invoice of invoices) {
    try {
      const { id, customer_id, ...invoiceData } = invoice;
      
      // Map old customer ID to new one
      const newCustomerId = customerMapping[customer_id] || null;
      
      const fullInvoiceData = {
        ...invoiceData,
        customer_id: newCustomerId,
        items: invoiceData.items || [],
        subtotal: invoiceData.subtotal || 0,
        tax: invoiceData.tax || 0,
        total: invoiceData.total || 0
      };
      
      await invoicesApi.create(fullInvoiceData);
      stats.invoices.success++;
    } catch (error) {
      console.error(`Failed to migrate invoice: ${invoice.invoice_number}`, error);
      stats.invoices.failed++;
    }
  }
  
  // Print results
  console.log('\n✅ Migration Complete!\n');
  console.log('📊 Results:');
  console.log(`  Customers: ${stats.customers.success} ✓  ${stats.customers.failed} ✗`);
  console.log(`  Vendors:   ${stats.vendors.success} ✓  ${stats.vendors.failed} ✗`);
  console.log(`  Products:  ${stats.products.success} ✓  ${stats.products.failed} ✗`);
  console.log(`  Invoices:  ${stats.invoices.success} ✓  ${stats.invoices.failed} ✗`);
  console.log('\n🎉 Your data has been migrated to Supabase!');
  console.log('\n💡 Tip: You can now clear localStorage if migration was successful:');
  console.log('   localStorage.clear()');
}

// Run the migration
migrateLocalStorageToSupabase().catch(console.error);
