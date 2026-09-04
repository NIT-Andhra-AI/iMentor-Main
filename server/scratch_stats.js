const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/imentor');
  const db = mongoose.connection.db;

  const users = db.collection('users');
  const chatHistories = db.collection('chathistories');
  const socraticSessions = db.collection('socraticsessions');
  const devLogs = db.collection('developerapilogs');

  // 1. Get NIT Andhra users
  const nitUsers = await users.find({ email: /nitandhra\.ac\.in$/ }).toArray();
  const nitUserIds = nitUsers.map(u => u._id);
  const nitEmails = nitUsers.map(u => ({ id: u._id.toString(), email: u.email }));

  // Aggregate chats
  console.log("=== CHAT ACTIVITY BY USER ===");
  for (const user of nitEmails) {
    const chats = await chatHistories.countDocuments({ userId: user.id });
    const socratic = await socraticSessions.countDocuments({ userId: user.id });
    const oId = new mongoose.Types.ObjectId(user.id);
    const chatsObjId = await chatHistories.countDocuments({ userId: oId });
    const socraticObjId = await socraticSessions.countDocuments({ userId: oId });
    
    const totalChats = Math.max(chats, chatsObjId) + Math.max(socratic, socraticObjId);
    console.log(`${user.email}: ${totalChats} total chat sessions`);
  }

  // 2. API Hub Stats
  console.log("\n=== API HUB USAGE STATS ===");
  const totalCalls = await devLogs.countDocuments();
  const uniqueEndpoints = await devLogs.distinct('endpoint');
  
  const pipeline = [
    { $group: { _id: "$endpoint", count: { $sum: 1 }, avgLatency: { $avg: "$responseTime" } } },
    { $sort: { count: -1 } }
  ];
  const endpointStats = await devLogs.aggregate(pipeline).toArray();

  const userPipeline = [
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  const apiUserStats = await devLogs.aggregate(userPipeline).toArray();

  console.log(`Total API Requests: ${totalCalls}`);
  console.log(`Total Unique Endpoints Accessed: ${uniqueEndpoints.length}`);
  console.log("Top Endpoints:");
  for (let stat of endpointStats.slice(0, 5)) {
    console.log(` - ${stat._id}: ${stat.count} calls (Avg Latency: ${Math.round(stat.avgLatency || 0)}ms)`);
  }
  
  console.log("Top API Users (by request count):");
  for (let stat of apiUserStats.slice(0, 3)) {
      // try to resolve email
      let email = "Unknown";
      try {
        const u = await users.findOne({ _id: new mongoose.Types.ObjectId(stat._id) });
        if (u) email = u.email;
      } catch(e) {}
      console.log(` - User ${email} (${stat._id}): ${stat.count} calls`);
  }

  process.exit(0);
}
run().catch(console.error);
