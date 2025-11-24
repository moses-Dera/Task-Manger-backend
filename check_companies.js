// Check all companies and users
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

async function checkCompanies() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all unique companies
        const companies = await User.distinct('company');
        console.log(`Found ${companies.length} companies:`, companies);
        console.log('');

        for (const company of companies) {
            console.log(`\n📦 Company: "${company}"`);

            const users = await User.find({ company }).select('name email role');
            console.log(`  Users (${users.length}):`);
            users.forEach(u => {
                console.log(`    - ${u.name} (${u.email}) - ${u.role} - ID: ${u._id}`);
            });

            const tasks = await Task.find({ company });
            console.log(`  Tasks (${tasks.length}):`);
            tasks.forEach(t => {
                console.log(`    - ${t.title} -> assigned_to: ${t.assigned_to}`);
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

checkCompanies();
