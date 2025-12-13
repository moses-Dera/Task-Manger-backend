require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        secure: true
    });
    console.log('Using CLOUDINARY_URL');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    console.log('Using individual Cloudinary credentials');
}

async function testUpload() {
    const testFile = path.join(__dirname, 'cloudinary_test.txt');
    fs.writeFileSync(testFile, 'Cloudinary upload test content');

    try {
        console.log('Attempting to upload to Cloudinary...');
        const result = await cloudinary.uploader.upload(testFile, {
            resource_type: 'auto',
            folder: 'debug_test'
        });
        console.log('Upload SUCCESS!');
        console.log('Public ID:', result.public_id);
        console.log('URL:', result.secure_url);
    } catch (error) {
        console.error('Upload FAILED!');
        console.error('Error:', error);
    } finally {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    }
}

testUpload();
