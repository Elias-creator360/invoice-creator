// Simple localStorage data extractor
// Run this in browser console to see your data

console.log('📦 LocalStorage Data:\n');

const data = {
  customers: JSON.parse(localStorage.getItem('customers') || '[]'),
  vendors: JSON.parse(localStorage.getItem('vendors') || '[]'),
  products: JSON.parse(localStorage.getItem('products') || '[]'),
  invoices: JSON.parse(localStorage.getItem('invoices') || '[]')
};

console.log(`Customers (${data.customers.length}):`);
console.table(data.customers);

console.log(`\nVendors (${data.vendors.length}):`);
console.table(data.vendors);

console.log(`\nProducts (${data.products.length}):`);
console.table(data.products);

console.log(`\nInvoices (${data.invoices.length}):`);
console.table(data.invoices);

console.log('\n📋 Full JSON Data:');
console.log(JSON.stringify(data, null, 2));
