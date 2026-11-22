const mongoose = require('mongoose');
async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_delivery', { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
}
module.exports = { connectDatabase, disconnectDatabase: () => mongoose.disconnect() };
