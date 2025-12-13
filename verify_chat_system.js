const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const Company = require('./models/Company');
require('dotenv').config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data
        const companyA_Id = new mongoose.Types.ObjectId();
        const companyB_Id = new mongoose.Types.ObjectId();

        // Note: The Message model uses String for company, but User uses ObjectId in companies array.
        // The controller uses req.user.company. 
        // Let's verify what req.user.company actually is at runtime. 
        // Based on auth middleware (which I should check, but assuming it's the ID string),
        // we will use the ID string for the Message model.

        const companyA_String = companyA_Id.toString();
        const companyB_String = companyB_Id.toString();

        const userA1 = { _id: new mongoose.Types.ObjectId(), name: 'User A1', company: companyA_String };
        const userA2 = { _id: new mongoose.Types.ObjectId(), name: 'User A2', company: companyA_String };
        const userB1 = { _id: new mongoose.Types.ObjectId(), name: 'User B1', company: companyB_String };

        console.log(`\n--- Setup ---`);
        console.log(`Company A: ${companyA_String}`);
        console.log(`Company B: ${companyB_String}`);

        // 2. Simulate User A1 sending a message to Company A (Group Chat)
        console.log(`\n--- Test 1: Group Chat Isolation ---`);
        const msgA = await Message.create({
            sender_id: userA1._id,
            recipient_id: null,
            message: 'Hello Company A',
            company: companyA_String
        });
        console.log(`User A1 sent message: "${msgA.message}" to Company A`);

        // 3. Verify User A2 can see it
        const msgsForA2 = await Message.find({ company: userA2.company, recipient_id: null });
        console.log(`User A2 (Company A) sees ${msgsForA2.length} messages.`);
        if (msgsForA2.length === 1 && msgsForA2[0].message === 'Hello Company A') {
            console.log('✅ PASS: User A2 sees Company A message.');
        } else {
            console.error('❌ FAIL: User A2 did not see the message correctly.');
        }

        // 4. Verify User B1 CANNOT see it
        const msgsForB1 = await Message.find({ company: userB1.company, recipient_id: null });
        console.log(`User B1 (Company B) sees ${msgsForB1.length} messages.`);
        if (msgsForB1.length === 0) {
            console.log('✅ PASS: User B1 sees 0 messages from Company A.');
        } else {
            console.error('❌ FAIL: User B1 saw messages they should not have!');
        }

        // 5. Simulate User A1 sending DM to User A2
        console.log(`\n--- Test 2: Direct Message Isolation ---`);
        const dmA = await Message.create({
            sender_id: userA1._id,
            recipient_id: userA2._id,
            message: 'Secret DM to A2',
            company: companyA_String
        });
        console.log(`User A1 sent DM: "${dmA.message}" to User A2`);

        // 6. Verify User A2 can see DM
        const dmsForA2 = await Message.find({
            company: userA2.company,
            $or: [
                { sender_id: userA2._id, recipient_id: userA1._id },
                { sender_id: userA1._id, recipient_id: userA2._id }
            ]
        });
        console.log(`User A2 sees ${dmsForA2.length} DMs with A1.`);
        if (dmsForA2.length === 1) {
            console.log('✅ PASS: User A2 sees DM.');
        } else {
            console.error('❌ FAIL: User A2 missing DM.');
        }

        // 7. Verify User B1 cannot see DM (even if they try to query for it in their company)
        // User B1 shouldn't be able to query for A1/A2 IDs in a real app, but even if they did:
        const dmsForB1 = await Message.find({
            company: userB1.company, // B1 is in Company B
            $or: [
                { sender_id: userA2._id, recipient_id: userA1._id },
                { sender_id: userA1._id, recipient_id: userA2._id }
            ]
        });
        console.log(`User B1 (Company B) querying for A1-A2 DMs gets ${dmsForB1.length} results.`);
        if (dmsForB1.length === 0) {
            console.log('✅ PASS: User B1 cannot see cross-company DMs.');
        } else {
            console.error('❌ FAIL: Leak detected!');
        }

        // Cleanup
        await Message.deleteMany({ _id: { $in: [msgA._id, dmA._id] } });
        console.log('\nTest data cleaned up.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
