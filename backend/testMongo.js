const mongoose = require('mongoose');
const uri = 'mongodb://mongo:bqbFyoJTiEkcGXZVJVTAfAPnqMcVkrLo@hopper.proxy.rlwy.net:30632';

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
