const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDatabase = require('./seed');

let mongoServer;

const connectDB = async () => {
  try {
    let dbMode = '';
    const uri = process.env.MONGODB_URI;

    if (uri) {
      console.log('Connecting to provided MONGODB_URI...');
      // If URI is provided, we MUST connect to it. No falling back to in-memory if it fails.
      await mongoose.connect(uri, { 
        serverSelectionTimeoutMS: 5000 
      });
      dbMode = 'MongoDB Atlas/Local';
    } else {
      // Only use in-memory if NO URI is provided at all (usually for local development without setup)
      console.warn('!!! WARNING: No MONGODB_URI found in environment variables. Falling back to In-Memory Database. Data will be LOST on restart. !!!');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      dbMode = 'In-Memory (EPHEMERAL)';
    }

    await seedDatabase();
    console.log(`✅ MongoDB Connected (${dbMode})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Check your MONGODB_URI in .env or Deployment settings.');
    process.exit(1);
  }
};

module.exports = connectDB;

