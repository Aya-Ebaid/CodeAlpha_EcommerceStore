const mongoose = require('mongoose');
let connecting = null;

function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
}

module.exports = connectDB;