const path = require('path');
const fs = require('fs');
const mongoose = require('../node_modules/mongoose');
const dotenv = require('../node_modules/dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/imentor';

async function syncToMongo() {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    const conn = await mongoose.createConnection(MONGO_URI).asPromise();
    
    const payloadPath = path.join(__dirname, 'skilltree_seed_payload.json');
    if (!fs.existsSync(payloadPath)) {
        console.error('Payload file not found:', payloadPath);
        process.exit(1);
    }
    
    console.log('Reading seed payload...');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    
    const skillNodes = payload.skillNodes || [];
    const conceptQuestions = payload.conceptQuestions || [];
    const questionBank = payload.questionBank || [];
    
    console.log(`Payload contains: ${skillNodes.length} Skill Nodes, ${conceptQuestions.length} Concept Questions, ${questionBank.length} MSQs.`);
    
    // 1. Sync SkillTree Collection
    const skillTreeColl = conn.db.collection('skilltrees');
    console.log('Upserting SkillTree nodes in bulk...');
    const skillOps = skillNodes.map(node => ({
        updateOne: {
            filter: { skillId: node.skillId },
            update: { $set: node },
            upsert: true
        }
    }));
    
    if (skillOps.length > 0) {
        const skillRes = await skillTreeColl.bulkWrite(skillOps, { ordered: false });
        console.log(`✓ SkillTree Sync: ${skillRes.upsertedCount} inserted, ${skillRes.modifiedCount} updated.`);
    }
    
    // 2. Sync ConceptQuestionBank Collection
    const cqbColl = conn.db.collection('conceptquestionbanks');
    console.log('Upserting ConceptQuestionBank records in bulk...');
    const cqbOps = conceptQuestions.map(q => ({
        updateOne: {
            filter: { course: q.course, concept: q.concept, question: q.question },
            update: { $set: q },
            upsert: true
        }
    }));
    
    if (cqbOps.length > 0) {
        const cqbRes = await cqbColl.bulkWrite(cqbOps, { ordered: false });
        console.log(`✓ ConceptQuestionBank Sync: ${cqbRes.upsertedCount} inserted, ${cqbRes.modifiedCount} updated.`);
    }
    
    // 3. Sync QuestionBank Collection (including MSQs)
    const qbColl = conn.db.collection('questionbanks');
    console.log('Upserting QuestionBank MSQ records in bulk...');
    const qbOps = questionBank.map(q => ({
        updateOne: {
            filter: { skillNodeId: q.skillNodeId, question: q.question },
            update: { $set: q },
            upsert: true
        }
    }));
    
    if (qbOps.length > 0) {
        const qbRes = await qbColl.bulkWrite(qbOps, { ordered: false });
        console.log(`✓ QuestionBank Sync: ${qbRes.upsertedCount} inserted, ${qbRes.modifiedCount} updated.`);
    }
    
    console.log('\n🎉 ALL QUESTION BANKS, MSQS, FAQS AND SKILL TREES SUCCESSFULLY SYNCED TO MONGODB!');
    await conn.close();
}

syncToMongo().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
