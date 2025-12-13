const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { verifyMagicLink } = require('./controllers/authController');
const User = require('./models/User');
const Company = require('./models/Company');
require('dotenv').config();

// Mock request/response
const mockReq = (body) => ({
    body,
    get: () => 'test-user-agent',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' }
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create a test user and company
        const uniqueEmail = `magic_test_${Date.now()}@example.com`;
        const companyName = `Magic Corp ${Date.now()}`;

        const company = await Company.create({
            name: companyName,
            email: `contact@${Date.now()}.com`
        });

        const user = await User.create({
            name: 'Magic Tester',
            email: uniqueEmail,
            password: 'password123',
            companies: [{
                company: company._id,
                role: 'manager',
                isActive: true
            }],
            currentCompany: company._id
        });

        console.log('Test User Created:', user.email);

        // 2. Generate Magic Token (simulating signup logic)
        const magicToken = jwt.sign(
            { userId: user._id, type: 'magic-link' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Magic Token Generated');

        // 3. Call verifyMagicLink
        console.log('\n--- Testing Verify Magic Link ---');
        const req = mockReq({ token: magicToken });
        const res = mockRes();

        await verifyMagicLink(req, res);

        if (res.data && res.data.success) {
            console.log('✅ Magic Link Verification Successful');
            console.log('Session Token:', res.data.token ? 'Present' : 'Missing');
            console.log('User Role:', res.data.user.role);
            console.log('User Company:', res.data.user.company);

            if (res.data.user.company === companyName) {
                console.log('✅ PASS: Company name matches.');
            } else {
                console.log('❌ FAIL: Company name mismatch.');
            }
        } else {
            console.log('❌ Magic Link Verification Failed:', res.data);
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
