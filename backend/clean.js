require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.deleteOne({ email: 'santosh.anu.anniversary.25@gmail.com' });
  await User.deleteOne({ email: 'darshit23082005@gmail.com' });
  console.log('Cleaned up test users');
  process.exit(0);
});
