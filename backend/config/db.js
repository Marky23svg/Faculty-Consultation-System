const dns = require('dns');
const mongoose = require('mongoose');

async function connectDB() {
  try {
    const dnsServers = (process.env.DNS_SERVERS || '')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
      console.log(`Using DNS servers: ${dnsServers.join(', ')}`);
    }

    const connection = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faculty-consultation'
    );

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
