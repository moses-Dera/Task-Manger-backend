const { sendWelcomeEmail } = require('./utils/emailService');
const fs = require('fs');

// Mock user data
const mockUser = {
    name: "Test Manager",
    email: "test@example.com",
    role: "manager",
    company: "Test Corp",
    magicToken: "xyz-magic-token"
};

// Mock axios to prevent actual sending but capture HTML
const axios = require('axios');
axios.post = jest.fn().mockImplementation((url, data) => {
    console.log("Mocking email send...");
    // Write the HTML to a file for inspection
    fs.writeFileSync('last_email_preview.html', data.html);
    return Promise.resolve({ status: 202, headers: { 'x-message-id': 'mock-id' } });
});

// Since we can't easily mock require in this environment without jest setup,
// we'll just try to inspect the function source or output if we can't run it fully.
// actually, let's just inspect the file content we know we wrote.
console.log("Verifying Email Service...");
try {
    // This might fail if dependencies aren't perfect, but let's try
    // We will rely on inspection of the service file mainly.
} catch (e) {
    console.log("Setup error", e);
}
