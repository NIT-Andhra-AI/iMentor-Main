const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/imentor');
  const db = mongoose.connection.db;

  const users = db.collection('users');
  const nitAndhraUsers = await users.countDocuments({ email: /@nitandhra\.ac\.in$/ });
  
  // Just find users who have logged in at least once or have an active state
  const activeNitAndhraUsers = await users.countDocuments({ 
      email: /@nitandhra\.ac\.in$/, 
      $or: [ { lastLogin: { $exists: true } }, { isActive: true } ]
  });

  const devLogs = db.collection('developerapilogs');
  const uniqueApiUsers = (await devLogs.distinct('userId')).length;
  
  const usersWithKeys = await users.countDocuments({ "developerProfile.apiKeys": { $exists: true, $not: {$size: 0} } });

  console.log(`NIT_ANDHRA_REGISTERED=${nitAndhraUsers}`);
  console.log(`NIT_ANDHRA_ACTIVE=${activeNitAndhraUsers}`);
  console.log(`API_HUB_USERS_LOGS=${uniqueApiUsers}`);
  console.log(`USERS_WITH_KEYS=${usersWithKeys}`);

  process.exit(0);
}
run().catch(console.error);
