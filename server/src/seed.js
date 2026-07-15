const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Party = require('./models/Party');
const Transaction = require('./models/Transaction');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ellora_crm');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ellora.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    await User.create({ name: 'Admin', email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10), role: 'admin' });
  }

  await Party.findOneAndUpdate({ partyName: 'Kundan Agencies' }, { $set: { partyName: 'Kundan Agencies', staffName: 'Ravi', territory: 'Nashik Area', division: 'West Division' } }, { upsert: true, new: true });

  await Transaction.deleteMany({});
  const sampleTransactions = [
    { date: new Date('2020-11-26'), month: 'Nov', year: '20-21', partyName: 'Kundan Agencies', staffName: 'Ravi', territory: 'Nashik Area', division: 'West Division', item: 'Ellora Palak-All Green(001)-500g', packingSize: 500, itemGroup: 'Spinach', voucherType: 'Veg Sales', voucherNo: 'V.Sale20-21:390', quantity: 10, caseKg: 5, rate: 80, value: 400, status: 'Sales-Vegitables', lineKey: 'V.Sale20-21:390|Ellora Palak-All Green(001)-500g|Kundan Agencies|400' },
    { date: new Date('2024-11-12'), month: 'Nov', year: '24-25', partyName: 'Kundan Agencies', staffName: 'Ravi', territory: 'Nashik Area', division: 'West Division', item: 'Ellora Palak-All Green(001)-500g', packingSize: 500, itemGroup: 'Spinach', voucherType: 'Veg Sales', voucherNo: 'V.Sale24-25:391', quantity: 100, caseKg: 50, rate: 80, value: 4000, status: 'Sales-Vegitables', lineKey: 'V.Sale24-25:391|Ellora Palak-All Green(001)-500g|Kundan Agencies|4000' },
    { date: new Date('2025-11-15'), month: 'Nov', year: '25-26', partyName: 'Kundan Agencies', staffName: 'Ravi', territory: 'Nashik Area', division: 'West Division', item: 'Ellora Palak-All Green(001)-500g', packingSize: 500, itemGroup: 'Spinach', voucherType: 'Veg Sales', voucherNo: 'V.Sale25-26:392', quantity: 140, caseKg: 70, rate: 80, value: 5600, status: 'Sales-Vegitables', lineKey: 'V.Sale25-26:392|Ellora Palak-All Green(001)-500g|Kundan Agencies|5600' },
    { date: new Date('2024-10-01'), month: 'Oct', year: '24-25', partyName: 'Other Party', staffName: 'Asha', territory: 'Pune Area', division: 'East Division', item: 'Ellora Radish', packingSize: 250, itemGroup: 'Radish', voucherType: 'Veg Sales', voucherNo: 'V.Sale24-25:393', quantity: 20, caseKg: 20, rate: 70, value: 1400, status: 'Sales-Vegitables', lineKey: 'V.Sale24-25:393|Ellora Radish|Other Party|1400' }
  ];

  await Transaction.insertMany(sampleTransactions);
  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
