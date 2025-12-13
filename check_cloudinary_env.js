require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

console.log('Checking Cloudinary Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? 'SET' : 'MISSING');
console.log('CLOUDINARY_API_KEY:', apiKey ? 'SET' : 'MISSING');
console.log('CLOUDINARY_API_SECRET:', apiSecret ? 'SET' : 'MISSING');
console.log('CLOUDINARY_URL:', cloudinaryUrl ? 'SET' : 'MISSING');
console.log('PORT:', process.env.PORT || 'NOT SET (Defaults to 5000)');

if (!cloudName || !apiKey || !apiSecret) {
    console.error('ERROR: Missing Cloudinary configuration!');
    process.exit(1);
} else {
    console.log('SUCCESS: All Cloudinary variables are set.');
}
