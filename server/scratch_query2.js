const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/imentor');
  const db = mongoose.connection.db;

  const users = db.collection('users');
  
  const nitAndhra = await users.countDocuments({ email: /@nitandhra\.ac\.in$/ });
  const studentNitAndhra = await users.countDocuments({ email: /@student\.nitandhra\.ac\.in$/ });
  
  const activeNitAndhra = await users.countDocuments({ 
      email: /@nitandhra\.ac\.in$/, 
      $or: [ { lastLogin: { $exists: true } }, { isActive: true } ]
  });

  const activeStudentNitAndhra = await users.countDocuments({ 
      email: /@student\.nitandhra\.ac\.in$/, 
      $or: [ { lastLogin: { $exists: true } }, { isActive: true } ]
  });

  console.log(`NIT_ANDHRA=${nitAndhra}`);
  console.log(`STUDENT_NIT_ANDHRA=${studentNitAndhra}`);
  console.log(`ACTIVE_NIT_ANDHRA=${activeNitAndhra}`);
  console.log(`ACTIVE_STUDENT_NIT_ANDHRA=${activeStudentNitAndhra}`);

  process.exit(0);
}
run().catch(console.error);
