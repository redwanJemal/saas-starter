import { seedCustomers } from './seed-customers';
import { seedPackages } from './seed-packages';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    console.log('🧹 Clearing existing data...');
    
    // Seed customers first
    const seededCustomers = await seedCustomers();
    
    // Then seed packages with customer references
    const seededPackages = await seedPackages(seededCustomers);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`- Customers: ${seededCustomers.length}`);
    console.log(`- Packages: ${seededPackages.length}`);
    
    // Display seeded data for verification
    console.log('\n👥 Customers:');
    seededCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} (${customer.email}) - ${customer.status}`);
    });

    console.log('\n📦 Packages:');
    seededPackages.forEach((pkg, index) => {
      const customer = seededCustomers.find(c => c.id === pkg.customerId);
      console.log(`  ${index + 1}. ${pkg.trackingNumber} - ${customer?.name} - ${pkg.status}`);
    });

    return { customers: seededCustomers, packages: seededPackages };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export { main as seedDatabase };
