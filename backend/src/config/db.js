const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDatabase = require('./seed');

let mongoServer;

const connectDB = async () => {
  try {
    let dbMode = 'In-Memory Database for testing';

    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        dbMode = 'MongoDB URI';
      } catch (externalErr) {
        console.warn('Could not connect to MONGODB_URI, falling back to in-memory MongoDB.');
      }
    }

    if (mongoose.connection.readyState !== 1) {
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
    }

    await seedDatabase();
    console.log(`MongoDB Connected (${dbMode})`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
