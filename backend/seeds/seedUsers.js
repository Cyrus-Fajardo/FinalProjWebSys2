const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const connectToDatabase = require('../config/db');

const seedUsers = async () => {
    if (!process.env.ALLOW_SEEDING) {
  console.log('❌ Seeding disabled');
  process.exit();
}
  await connectToDatabase();

  await User.deleteMany(); // optional (clears old users)

  const password = await bcrypt.hash('password123', 10);

  await User.insertMany([
    {
        fullname:"Kaluppa Foundation Admin",
      email: 'kaluppa@test.com',
      password,
      role: 'Kaluppa Foundation'
    },
    {
        fullname:"DTI Admin",
      email: 'dti@test.com',
      password,
      role: 'DTI'
    }
  ]);

  console.log('Seed completed');
  process.exit();
};

seedUsers();