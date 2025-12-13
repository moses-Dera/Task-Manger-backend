const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Company = require('./models/Company');
require('dotenv').config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data
        const company = await Company.create({ name: `Notif Corp ${Date.now()}`, email: `notif${Date.now()}@test.com` });
        const manager = await User.create({
            name: 'Notif Manager',
            email: `manager_notif_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'manager', isActive: true }],
            currentCompany: company._id
        });
        const employee = await User.create({
            name: 'Notif Employee',
            email: `employee_notif_${Date.now()}@example.com`,
            password: 'password',
            companies: [{ company: company._id, role: 'employee', isActive: true }],
            currentCompany: company._id
        });

        console.log(`\n--- Setup ---`);
        console.log(`Company ID: ${company._id}`);
        console.log(`Manager ID: ${manager._id}`);
        console.log(`Employee ID: ${employee._id}`);

        // 2. Simulate notifyTeamMeeting Query (The Buggy One)
        console.log(`\n--- Test 1: Simulate Current Controller Query ---`);
        // The controller uses: User.find({ company: req.user.company, role: 'employee' })
        // req.user.company is the company ID string (or ObjectId)

        const buggyQueryResults = await User.find({
            company: manager.currentCompany,
            role: 'employee'
        });
        console.log(`Buggy Query Found: ${buggyQueryResults.length} employees`);
        if (buggyQueryResults.length === 0) {
            console.log('⚠️ CONFIRMED: Current query fails to find employee (Expected Bug).');
        } else {
            console.log('❓ Unexpected: Buggy query found employees?');
        }

        // 3. Simulate Correct Query
        console.log(`\n--- Test 2: Simulate Correct Query ---`);
        const correctQueryResults = await User.find({
            'companies.company': manager.currentCompany,
            'companies.role': 'employee'
        });
        console.log(`Correct Query Found: ${correctQueryResults.length} employees`);
        if (correctQueryResults.length === 1) {
            console.log('✅ PASS: Correct query finds employee.');
        } else {
            console.error('❌ FAIL: Correct query failed.');
        }

        // Cleanup
        // await User.deleteMany({ _id: { $in: [manager._id, employee._id] } });
        // await Company.deleteOne({ _id: company._id });
        console.log('\nTest finished.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
