const mongoose = require('mongoose');
const { enableInMemoryMode } = require('./inMemoryStore');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atomic-ops';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 1500 // Fast 1.5s check
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning]: MongoDB connection failed (${error.message}).`);
    console.log(`[In-Memory Mode]: Activated zero-dependency In-Memory Database engine!`);
    
    enableInMemoryMode();
    
    // Auto-seed in-memory database
    const seedData = require('../seed');
    await seedData(true);
    console.log(`[Auto-Seed]: In-memory database populated with demo events & credentials!`);
  }
};

module.exports = connectDB;
