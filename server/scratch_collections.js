const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/imentor');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(collections.map(c => c.name).join(', '));
  process.exit(0);
}
run().catch(console.error);
