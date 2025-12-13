const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyTeamMembers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find an employee user
        const user = await User.findOne({ 'companies.role': 'employee' });

        if (!user) {
            console.log('No employee found');
            return;
        }

        // Simulate auth middleware logic
        let companyId;
        if (user.currentCompany && user.companies) {
            const activeCompany = user.companies.find(c => c.company.toString() === user.currentCompany.toString());
            if (activeCompany) {
                companyId = activeCompany.company;
            }
        }

        console.log('User:', user.email);
        console.log('Company ID:', companyId);

        if (!companyId) {
            console.log('User has no active company');
            return;
        }

        console.log('\n--- Testing Current (Broken) Query ---');
        const brokenQuery = await User.find({
            company: companyId,
            _id: { $ne: user._id }
        });
        console.log(`Found ${brokenQuery.length} members with 'company' field`);

        console.log('\n--- Testing Corrected Query ---');
        const correctQuery = await User.find({
            'companies.company': companyId,
            _id: { $ne: user._id }
        });
        console.log(`Found ${correctQuery.length} members with 'companies.company' field`);

        if (correctQuery.length > 0) {
            console.log('Members found:', correctQuery.map(u => u.name).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyTeamMembers();
